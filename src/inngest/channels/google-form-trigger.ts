import { channel, topic } from "@inngest/realtime";

export const googleFormTriggerChannelName = (workflowId: string) =>
  `workflow:${workflowId}:google-form-trigger-execution`;

export const googleFormTriggerChannel = channel(
  googleFormTriggerChannelName,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
