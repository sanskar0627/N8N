import { hydrateNodeData } from "@/features/credentials/lib/hydrate-ai-node-data";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { WorkflowContext } from "@/features/executions/types";
import { NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";

const TRIGGER_NODE_TYPES: NodeType[] = [
  NodeType.INITIAL,
  NodeType.MANUAL_TRIGGER,
  NodeType.GOOGLE_FORM_TRIGGER,
  NodeType.STRIPE_TRIGGER,
];

function createMockStep() {
  const runFn = async <T>(
    _name: string,
    fn: () => Promise<T> | T,
  ): Promise<T> => {
    return await fn();
  };

  return {
    run: runFn,
    ai: {
      wrap: async <T>(
        _name: string,
        fn: (...args: unknown[]) => Promise<T>,
        ...args: unknown[]
      ): Promise<T> => {
        return await fn(...args);
      },
    },
    sleep: async () => {},
    sleepUntil: async () => {},
    sendEvent: async () => ({ ids: [] }),
    invoke: async () => ({}),
    waitForEvent: async () => null,
    waitForSignal: async () => null,
    sendSignal: async () => {},
    fetch: async () => new Response(),
  };
}

interface TestNodeParams {
  workflowId: string;
  nodeId: string;
  userId: string;
  mockContext?: Record<string, unknown>;
  nodeType?: string;
  nodeData?: Record<string, unknown>;
}

interface TestNodeResult {
  success: boolean;
  output?: WorkflowContext;
  error?: string;
}

export async function executeNodeForTest(
  params: TestNodeParams,
): Promise<TestNodeResult> {
  const { workflowId, nodeId, userId, mockContext = {}, nodeType, nodeData: providedNodeData } = params;

  try {
    const node = await prisma.node.findFirst({
      where: { id: nodeId, workflowId },
      include: {
        workflow: { select: { userId: true } },
      },
    });

    let resolvedType: NodeType;
    let resolvedData: Record<string, unknown>;

    if (node) {
      if (node.workflow.userId !== userId) {
        return { success: false, error: "Unauthorized" };
      }
      resolvedType = node.type;
      resolvedData =
        node.data && typeof node.data === "object" && !Array.isArray(node.data)
          ? (node.data as Record<string, unknown>)
          : {};
    } else if (nodeType && providedNodeData) {
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, userId },
      });
      if (!workflow) {
        return { success: false, error: "Unauthorized" };
      }
      resolvedType = nodeType as NodeType;
      resolvedData = providedNodeData;
    } else {
      return {
        success: false,
        error: "Node not found. Please save the workflow first or try again.",
      };
    }

    if (TRIGGER_NODE_TYPES.includes(resolvedType as NodeType)) {
      return {
        success: false,
        error: "Trigger nodes cannot be tested individually",
      };
    }

    const executor = getExecutor(resolvedType as NodeType);

    const step = createMockStep() as unknown as Parameters<
      typeof executor
    >[0]["step"];
    const nodeData = await hydrateNodeData({
      nodeType: resolvedType,
      data: resolvedData,
      userId,
    });

    const result = await executor({
      data: nodeData,
      nodeId: nodeId,
      workflowId,
      userId,
      context: mockContext,
      step,
    });

    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
