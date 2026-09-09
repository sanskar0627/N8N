import { NonRetriableError } from "inngest";
import { nodeStepId } from "@/features/executions/lib/step-id";
import type { NodeExecutor } from "@/features/executions/types";

type StripeTriggerData = Record<string, unknown>;

export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  nodeId,
  context,
  step,
}) => {
  try {
    return await step.run(
      nodeStepId("stripe-trigger", nodeId),
      async () => context,
    );
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Stripe Trigger: execution failed", {
      cause: error,
    });
  }
};
