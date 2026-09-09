import { createId } from "@paralleldrive/cuid2";
import { hydrateNodeData } from "@/features/credentials/lib/hydrate-ai-node-data";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { redactExecutionOutput } from "@/features/executions/lib/redact-execution-output";
import { topologicalSort } from "@/inngest/utils";
import { ExecutionStatus, type NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import type { WorkflowContext } from "@/features/executions/types";

// A lightweight step shim that mimics Inngest's step.run() but just executes inline
const createMockStep = () => ({
  run: async <T>(_name: string, fn: () => Promise<T>): Promise<T> => {
    return fn();
  },
  // Add other step methods as no-ops in case they're called
  sleep: async () => {},
  sleepUntil: async () => {},
  waitForEvent: async () => null,
  sendEvent: async () => {},
});

export const executeWorkflowDirect = async (workflowId: string) => {
  const inngestEventId = createId();

  // Create execution record
  await prisma.execution.create({
    data: {
      workflowId,
      inngestEventId,
    },
  });

  try {
    // Fetch workflow with nodes and connections
    const workflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: workflowId },
      include: {
        nodes: true,
        connection: true,
      },
    });

    const sortedNodes = topologicalSort(workflow.nodes, workflow.connection);
    const mockStep = createMockStep();
    let context: WorkflowContext = {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      const nodeData = await hydrateNodeData({
        nodeType: node.type as NodeType,
        data: node.data as Record<string, unknown>,
        userId: workflow.userId,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      try {
        context = await executor({
          data: nodeData,
          nodeId: node.id,
          workflowId,
          userId: workflow.userId,
          context,
          step: mockStep as any,
          signal: controller.signal,
          executionId: inngestEventId,
        });
      } catch (error) {
        // Save partial output on failure
        await prisma.execution.update({
          where: { inngestEventId, workflowId },
          data: {
            status: ExecutionStatus.FAILED,
            completedAt: new Date(),
            output: redactExecutionOutput(context) as typeof context,
            error: error instanceof Error ? error.message : "Node execution failed",
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        });
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    // Mark as success
    await prisma.execution.update({
      where: { inngestEventId, workflowId },
      data: {
        status: ExecutionStatus.SUCCESS,
        completedAt: new Date(),
        output: redactExecutionOutput(context) as typeof context,
      },
    });

    return { workflowId, executionId: inngestEventId, result: context };
  } catch (error) {
    // Ensure execution is marked failed if not already
    await prisma.execution.updateMany({
      where: { inngestEventId, status: ExecutionStatus.RUNNING },
      data: {
        status: ExecutionStatus.FAILED,
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "Execution failed",
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
};
