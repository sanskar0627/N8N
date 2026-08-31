import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeEventTypesSchema } from "@/features/triggers/components/stripe-trigger/schema";
import {
  buildStripeInitialData,
  getStripeEventId,
  shouldProcessStripeEvent,
} from "@/features/triggers/components/stripe-trigger/utils";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";

const MAX_BODY_BYTES = 512 * 1024;
const stripe = new Stripe("sk_test_m9m_webhook_verification");

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ received: false, error }, { status });

export async function POST(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflowId");
  const nodeId = request.nextUrl.searchParams.get("nodeId");

  if (!workflowId || !nodeId) {
    return errorResponse("Workflow ID and node ID are required", 400);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("Content-Type must be application/json", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large", 413);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return errorResponse("Stripe-Signature header is required", 400);
  }

  const node = await prisma.node.findFirst({
    where: {
      id: nodeId,
      workflowId,
      type: NodeType.STRIPE_TRIGGER,
    },
    select: { data: true },
  });

  if (!node) {
    return errorResponse("Stripe Trigger not found", 404);
  }

  const nodeData =
    node.data && typeof node.data === "object" && !Array.isArray(node.data)
      ? (node.data as Record<string, unknown>)
      : {};
  const webhookSecret = nodeData.webhookSecret;

  if (typeof webhookSecret !== "string") {
    return errorResponse("Stripe webhook is not configured", 409);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Could not read request body", 400);
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large", 413);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
      300,
    );
  } catch {
    return errorResponse("Invalid Stripe signature", 400);
  }

  const allowedEventTypes =
    stripeEventTypesSchema.safeParse(nodeData.allowedEventTypes).data ?? [];
  if (!shouldProcessStripeEvent(event.type, allowedEventTypes)) {
    return NextResponse.json({
      received: true,
      ignored: true,
      eventType: event.type,
    });
  }

  try {
    await sendWorkflowExecution({
      workflowId,
      initialData: buildStripeInitialData(event),
      eventId: getStripeEventId(workflowId, nodeId, event.id),
    });

    return NextResponse.json(
      { received: true, eventId: event.id },
      { status: 202 },
    );
  } catch {
    return errorResponse("Failed to queue workflow execution", 500);
  }
}
