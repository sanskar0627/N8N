import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

type StripeTriggerData = Record<string, unknown>;

export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  nodeId,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publish(
    stripeTriggerChannel(workflowId).status({ nodeId, status: "loading" }),
  );

  try {
    const result = await step.run("stripe-trigger", async () => {
      if (!context.stripe) {
        throw new NonRetriableError(
          "Stripe Trigger: webhook event data is missing",
        );
      }
      return context;
    });

    await publish(
      stripeTriggerChannel(workflowId).status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    await publish(
      stripeTriggerChannel(workflowId).status({ nodeId, status: "error" }),
    );
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Stripe Trigger: execution failed", {
      cause: error,
    });
  }
};
