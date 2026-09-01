import { channel, topic } from "@inngest/realtime";

export const workflowNodeStatusChannelName = (workflowId: string) =>
  `workflow:${workflowId}:node-status`;

export const workflowNodeStatusChannel = channel(
  workflowNodeStatusChannelName,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
