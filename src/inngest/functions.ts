import { NonRetriableError } from "inngest";
import { hydrateNodeData } from "@/features/credentials/lib/hydrate-ai-node-data";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { redactExecutionOutput } from "@/features/executions/lib/redact-execution-output";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { workflowNodeStatusChannel } from "./channels/workflow-node-status";
import { inngest } from "./client";
import { topologicalSort } from "./utils";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 3,
    onFailure: async ({ event }) => {
      return prisma.execution.updateMany({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          completedAt: new Date(),
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  { event: "workflows/execute.workflow" },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId)
      throw new NonRetriableError("Event ID or Workflow ID is missing");

    await step.run("create-execution", async () => {
      await prisma.execution.upsert({
        where: { inngestEventId },
        update: {},
        create: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const { sortedNodes, userId } = await step.run(
      "prepare-workflow",
      async () => {
        const workflow = await prisma.workflow.findUniqueOrThrow({
          where: { id: workflowId },
          include: {
            nodes: true,
            connection: true,
          },
        });

        const executable = workflow.nodes.filter(
          (node) => node.type !== NodeType.INITIAL,
        );
        const sorted = topologicalSort(executable, workflow.connection);
        return { sortedNodes: sorted, userId: workflow.userId };
      },
    );

    if (sortedNodes.length === 0) {
      throw new NonRetriableError(
        "This workflow has no executable nodes. Add a trigger and at least one action, then try again.",
      );
    }

    let context = event.data.initialData || {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      const nodeData = await hydrateNodeData({
        nodeType: node.type,
        data: node.data as Record<string, unknown>,
        userId,
      });
      await publish(
        workflowNodeStatusChannel(workflowId).status({
          nodeId: node.id,
          status: "loading",
          executionId: inngestEventId,
        }),
      );

      const controller = new AbortController();
      const executePromise = executor({
        data: nodeData,
        nodeId: node.id,
        workflowId,
        userId,
        context,
        step,
        signal: controller.signal,
        executionId: inngestEventId,
      });

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(
            new NonRetriableError(
              "Timeout: Execution took longer than 60 seconds",
            ),
          );
        }, 60000);
      });

      try {
        context = await Promise.race([executePromise, timeoutPromise]);
        await publish(
          workflowNodeStatusChannel(workflowId).status({
            nodeId: node.id,
            status: "success",
            executionId: inngestEventId,
          }),
        );
      } catch (error) {
        await publish(
          workflowNodeStatusChannel(workflowId).status({
            nodeId: node.id,
            status: "error",
            executionId: inngestEventId,
          }),
        );
        try {
          await step.run(`persist-partial-output:${node.id}`, async () => {
            await prisma.execution.update({
              where: {
                inngestEventId,
                workflowId,
              },
              data: {
                output: redactExecutionOutput(context) as typeof context,
              },
            });
          });
        } catch {
          // Keep the original node error if the checkpoint write fails.
        }
        throw error;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    await step.run("update-execution", async () => {
      await prisma.execution.update({
        where: {
          inngestEventId,
          workflowId,
        },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: redactExecutionOutput(context) as typeof context,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);
