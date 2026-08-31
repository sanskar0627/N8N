"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export type StripeTriggerToken = Realtime.Token<
  ReturnType<typeof stripeTriggerChannel>,
  ["status"]
>;

export async function fetchStripeTriggerRealtimeToken(
  workflowId: string,
): Promise<StripeTriggerToken> {
  const session = await requireAuth();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: session.user.id },
    select: { id: true },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return getSubscriptionToken(inngest, {
    channel: stripeTriggerChannel(workflowId),
    topics: ["status"],
  });
}
