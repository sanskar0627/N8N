import { channel, topic } from "@inngest/realtime";

export const stripeTriggerChannelName = (workflowId: string) =>
  `workflow:${workflowId}:stripe-trigger-execution`;

export const stripeTriggerChannel = channel(stripeTriggerChannelName).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
