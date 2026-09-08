import { type NextRequest, NextResponse } from "next/server";
import { readNodeSecretSafe } from "@/features/credentials/lib/node-secret";
import { executeWorkflowDirect } from "@/features/executions/lib/direct-executor";
import { googleFormWebhookPayloadSchema } from "@/features/triggers/components/google-form-trigger/schema";
import {
  buildGoogleFormInitialData,
  getGoogleFormEventId,
  safeCompareSecrets,
} from "@/features/triggers/components/google-form-trigger/utils";
import { NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";

export const maxDuration = 60;

const MAX_BODY_BYTES = 256 * 1024;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

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

  const node = await prisma.node.findFirst({
    where: {
      id: nodeId,
      workflowId,
      type: NodeType.GOOGLE_FORM_TRIGGER,
    },
    select: { data: true },
  });

  const nodeData =
    node?.data && typeof node.data === "object" && !Array.isArray(node.data)
      ? (node.data as Record<string, unknown>)
      : {};
  const expectedSecret = readNodeSecretSafe(nodeData.secret);
  const providedSecret = request.headers.get("x-secret") ?? "";

  if (
    !node ||
    !expectedSecret ||
    !providedSecret ||
    !safeCompareSecrets(providedSecret, expectedSecret)
  ) {
    return errorResponse("Invalid or missing webhook secret", 401);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return errorResponse("Request body is too large", 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const payload = googleFormWebhookPayloadSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid Google Form submission",
        issues: payload.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    await executeWorkflowDirect(workflowId, undefined, {
      initialData: buildGoogleFormInitialData(payload.data),
      eventId: getGoogleFormEventId(workflowId, payload.data.responseId),
    });

    return NextResponse.json(
      { success: true, message: "Google Form submission accepted" },
      { status: 202 },
    );
  } catch (error) {
    console.error("[google-form webhook] execution failed:", error);
    return errorResponse("Failed to run workflow execution", 500);
  }
}
