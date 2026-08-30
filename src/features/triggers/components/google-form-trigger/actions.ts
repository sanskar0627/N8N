"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export type GoogleFormTriggerToken = Realtime.Token<
  ReturnType<typeof googleFormTriggerChannel>,
  ["status"]
>;

export async function fetchGoogleFormTriggerRealtimeToken(
  workflowId: string,
): Promise<GoogleFormTriggerToken> {
  const session = await requireAuth();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: session.user.id },
    select: { id: true },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return getSubscriptionToken(inngest, {
    channel: googleFormTriggerChannel(workflowId),
    topics: ["status"],
  });
}
