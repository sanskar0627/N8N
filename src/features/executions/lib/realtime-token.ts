"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { workflowNodeStatusChannel } from "@/inngest/channels/workflow-node-status";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

let realtimeTokenWarned = false;

export type WorkflowNodeStatusToken = Realtime.Token<
  ReturnType<typeof workflowNodeStatusChannel>,
  ["status"]
>;

export async function fetchWorkflowNodeStatusToken(
  workflowId: string,
): Promise<WorkflowNodeStatusToken | null> {
  try {
    const session = await requireAuth();
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: session.user.id },
      select: { id: true },
    });

    if (!workflow) {
      return null;
    }

    return await getSubscriptionToken(inngest, {
      channel: workflowNodeStatusChannel(workflowId),
      topics: ["status"],
    });
  } catch (error) {
    if (!realtimeTokenWarned) {
      console.warn("[realtime] Inngest not reachable — realtime node status disabled (this is normal if Inngest is not running)");
      realtimeTokenWarned = true;
    }
    return null;
  }
}
