"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { workflowNodeStatusChannel } from "@/inngest/channels/workflow-node-status";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export type WorkflowNodeStatusToken = Realtime.Token<
  ReturnType<typeof workflowNodeStatusChannel>,
  ["status"]
>;

export async function fetchWorkflowNodeStatusToken(
  workflowId: string,
): Promise<WorkflowNodeStatusToken> {
  const session = await requireAuth();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: session.user.id },
    select: { id: true },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return getSubscriptionToken(inngest, {
    channel: workflowNodeStatusChannel(workflowId),
    topics: ["status"],
  });
}
