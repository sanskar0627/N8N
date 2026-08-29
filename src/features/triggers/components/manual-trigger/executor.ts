import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  workflowId,
  context,
  step,
  publish,
}) => {
  await publish(
    manualTriggerChannel(workflowId).status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    const result = await step.run("manual-trigger", async () => context);

    await publish(
      manualTriggerChannel(workflowId).status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    await publish(
      manualTriggerChannel(workflowId).status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Manual Trigger: execution failed", {
      cause: error,
    });
  }
};
