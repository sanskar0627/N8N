import { NonRetriableError } from "inngest";
import { nodeStepId } from "@/features/executions/lib/step-id";
import type { NodeExecutor } from "@/features/executions/types";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  context,
  step,
}) => {
  try {
    return await step.run(
      nodeStepId("manual-trigger", nodeId),
      async () => context,
    );
  } catch (error) {
    throw new NonRetriableError("Manual Trigger: execution failed", {
      cause: error,
    });
  }
};
