import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

type GoogleFormTriggerData = Record<string, unknown>;

export const googleFormTriggerExecutor: NodeExecutor<
  GoogleFormTriggerData
> = async ({ nodeId, workflowId, context, step, publish }) => {
  await publish(
    googleFormTriggerChannel(workflowId).status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    const result = await step.run("google-form-trigger", async () => {
      if (!context.googleForm) {
        throw new NonRetriableError(
          "Google Form Trigger: submission data is missing",
        );
      }
      return context;
    });

    await publish(
      googleFormTriggerChannel(workflowId).status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    await publish(
      googleFormTriggerChannel(workflowId).status({
        nodeId,
        status: "error",
      }),
    );
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Google Form Trigger: execution failed", {
      cause: error,
    });
  }
};
