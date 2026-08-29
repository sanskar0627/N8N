import { channel, topic } from "@inngest/realtime";

export const httpRequestChannelName = (workflowId: string) =>
  `workflow:${workflowId}:http-request-execution`;

export const httpRequestChannel = channel(httpRequestChannelName).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
