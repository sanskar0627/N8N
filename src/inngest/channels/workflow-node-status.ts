import { channel, topic } from "@inngest/realtime";
import type { NodeStatusEvent } from "./node-status";

export const workflowNodeStatusChannelName = (workflowId: string) =>
  `workflow:${workflowId}:node-status`;

export const workflowNodeStatusChannel = channel(
  workflowNodeStatusChannelName,
).addTopic(topic("status").type<NodeStatusEvent>());
