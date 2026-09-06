import { createId } from "@paralleldrive/cuid2";
import { inngest } from "./client";

export const sendWorkflowExecution = (data: {
  workflowId: string;
  [key: string]: unknown;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
    id: createId(),
  });
};
