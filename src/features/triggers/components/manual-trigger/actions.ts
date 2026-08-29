"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export type ManualTriggerToken = Realtime.Token<
  ReturnType<typeof manualTriggerChannel>,
  ["status"]
>;

export async function fetchManualTriggerRealtimeToken(
  workflowId: string,
): Promise<ManualTriggerToken> {
  const session = await requireAuth();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: session.user.id },
    select: { id: true },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const token = await getSubscriptionToken(inngest, {
    channel: manualTriggerChannel(workflowId),
    topics: ["status"],
  });

  return token;
}
