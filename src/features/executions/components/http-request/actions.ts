"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export type HttpRequestToken = Realtime.Token<
  ReturnType<typeof httpRequestChannel>,
  ["status"]
>;

export async function fetchHttpRequestRealtimeToken(
  workflowId: string,
): Promise<HttpRequestToken> {
  const session = await requireAuth();
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: session.user.id },
    select: { id: true },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const token = await getSubscriptionToken(inngest, {
    channel: httpRequestChannel(workflowId),
    topics: ["status"],
  });

  return token;
}
