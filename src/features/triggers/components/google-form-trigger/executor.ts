import { NonRetriableError } from "inngest";
import { nodeStepId } from "@/features/executions/lib/step-id";
import type { NodeExecutor } from "@/features/executions/types";

type GoogleFormTriggerData = Record<string, unknown>;

export const googleFormTriggerExecutor: NodeExecutor<
  GoogleFormTriggerData
> = async ({ nodeId, context, step }) => {
  try {
    return await step.run(
      nodeStepId("google-form-trigger", nodeId),
      async () => context,
    );
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Google Form Trigger: execution failed", {
      cause: error,
    });
  }
};
