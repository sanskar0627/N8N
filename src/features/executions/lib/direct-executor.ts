import { createId } from "@paralleldrive/cuid2";
import { hydrateNodeData } from "@/features/credentials/lib/hydrate-ai-node-data";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { redactExecutionOutput } from "@/features/executions/lib/redact-execution-output";
import type { WorkflowContext } from "@/features/executions/types";
import type { Connection, Node } from "@/generated/prisma/client";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { topologicalSort } from "@/inngest/utils";
import prisma from "@/lib/db";

export type DirectExecutorNode = {
  id: string;
  type: string;
  data?: unknown;
};

export type DirectExecutorConnection = {
  fromNodeId: string;
  toNodeId: string;
  fromOutput?: string | null;
  toInput?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

// A lightweight step shim that mimics Inngest's step.run() but just executes inline
const createMockStep = () => ({
  run: async <T>(_name: string, fn: () => Promise<T>): Promise<T> => {
    return fn();
  },
  sleep: async () => {},
  sleepUntil: async () => {},
  waitForEvent: async () => null,
  sendEvent: async () => {},
});

export const executeWorkflowDirect = async (
  workflowId: string,
  graph?: {
    nodes: DirectExecutorNode[];
    connections: DirectExecutorConnection[];
  },
) => {
  const inngestEventId = createId();

  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId },
    include: {
      nodes: true,
      connection: true,
    },
  });

  const dbById = new Map(workflow.nodes.map((node) => [node.id, node]));
  const sourceNodes = graph?.nodes ?? workflow.nodes;
  const sourceConnections = graph?.connections ?? workflow.connection;

  const mergedNodes = sourceNodes.map((node) => {
    const dbNode = dbById.get(node.id);
    return {
      id: node.id,
      type: dbNode?.type ?? node.type,
      data: dbNode?.data ?? node.data ?? {},
    };
  });

  const executableNodes = mergedNodes.filter(
    (node) => node.type !== NodeType.INITIAL,
  );

  if (executableNodes.length === 0) {
    throw new Error(
      "This workflow has no executable nodes. Add a trigger and at least one action, then try again.",
    );
  }

  const connections: Pick<Connection, "fromNodeId" | "toNodeId">[] =
    sourceConnections
      .map((connection) => ({
        fromNodeId: connection.fromNodeId,
        toNodeId: connection.toNodeId,
      }))
      .filter(
        (connection) =>
          executableNodes.some((node) => node.id === connection.fromNodeId) &&
          executableNodes.some((node) => node.id === connection.toNodeId),
      );

  const nodesForSort = executableNodes as unknown as Node[];
  const connectionsForSort = connections as unknown as Connection[];
  const sortedNodes = topologicalSort(nodesForSort, connectionsForSort);

  await prisma.execution.create({
    data: {
      workflowId,
      inngestEventId,
    },
  });

  try {
    const mockStep = createMockStep();
    let context: WorkflowContext = {};

    console.log(
      "[executeWorkflowDirect] running",
      workflowId,
      sortedNodes.map((node) => `${node.id}:${node.type}`).join(","),
    );

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      const nodeData = await hydrateNodeData({
        nodeType: node.type as NodeType,
        data: asRecord(node.data),
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
        await prisma.execution.update({
          where: { inngestEventId, workflowId },
          data: {
            status: ExecutionStatus.FAILED,
            completedAt: new Date(),
            output: redactExecutionOutput(context) as any,
            error:
              error instanceof Error ? error.message : "Node execution failed",
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        });
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    await prisma.execution.update({
      where: { inngestEventId, workflowId },
      data: {
        status: ExecutionStatus.SUCCESS,
        completedAt: new Date(),
        output: redactExecutionOutput(context) as any,
      },
    });

    return { workflowId, executionId: inngestEventId, result: context };
  } catch (error) {
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
