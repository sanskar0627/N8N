import { NonRetriableError } from "inngest";
import { hydrateNodeData } from "@/features/credentials/lib/hydrate-ai-node-data";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { ExecutionStatus, type NodeType } from "@/generated/prisma/enums";
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

    const { sortedNodes } = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connection: true,
        },
      });

      const sorted = topologicalSort(workflow.nodes, workflow.connection);
      return { sortedNodes: sorted };
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: { userId: true },
      });
      return workflow.userId;
    });

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
        }),
      );

      const executePromise = executor({
        data: nodeData,
        nodeId: node.id,
        workflowId,
        userId,
        context,
        step,
        publish,
      });

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Timeout: Execution took longer than 60 seconds"));
        }, 60000);
      });

      try {
        context = await Promise.race([executePromise, timeoutPromise]);
        await publish(
          workflowNodeStatusChannel(workflowId).status({
            nodeId: node.id,
            status: "success",
          }),
        );
      } catch (error) {
        await publish(
          workflowNodeStatusChannel(workflowId).status({
            nodeId: node.id,
            status: "error",
          }),
        );
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
          output: context,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);
