import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { WorkflowContext } from "@/features/executions/types";
import { NodeType } from "@/generated/prisma";
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

function createMockPublish() {
  return async () => {};
}

interface TestNodeParams {
  workflowId: string;
  nodeId: string;
  userId: string;
  mockContext?: Record<string, unknown>;
}

interface TestNodeResult {
  success: boolean;
  output?: WorkflowContext;
  error?: string;
}

export async function executeNodeForTest(
  params: TestNodeParams,
): Promise<TestNodeResult> {
  const { workflowId, nodeId, userId, mockContext = {} } = params;

  try {
    const node = await prisma.node.findFirst({
      where: { id: nodeId, workflowId },
      include: {
        workflow: { select: { userId: true } },
      },
    });

    if (!node) {
      return { success: false, error: "Node not found" };
    }

    if (node.workflow.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (TRIGGER_NODE_TYPES.includes(node.type as NodeType)) {
      return {
        success: false,
        error: "Trigger nodes cannot be tested individually",
      };
    }

    const executor = getExecutor(node.type as NodeType);

    const step = createMockStep() as unknown as Parameters<
      typeof executor
    >[0]["step"];
    const publish = createMockPublish() as unknown as Parameters<
      typeof executor
    >[0]["publish"];

    const result = await executor({
      data:
        node.data && typeof node.data === "object" && !Array.isArray(node.data)
          ? (node.data as Record<string, unknown>)
          : {},
      nodeId: node.id,
      workflowId,
      userId,
      context: mockContext,
      step,
      publish,
    });

    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
