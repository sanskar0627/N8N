import { createId } from "@paralleldrive/cuid2";
import toposort from "toposort";
import type { Connection, Node } from "@/generated/prisma/client";
import { inngest } from "./client";

type GraphNode = Pick<Node, "id">;
type GraphConnection = Pick<Connection, "fromNodeId" | "toNodeId">;

export const reachableFrom = <T extends GraphNode>(
  startIds: string[],
  nodes: T[],
  connections: GraphConnection[],
): { nodes: T[]; connections: GraphConnection[] } => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoing = new Map<string, string[]>();

  for (const connection of connections) {
    const next = outgoing.get(connection.fromNodeId) ?? [];
    next.push(connection.toNodeId);
    outgoing.set(connection.fromNodeId, next);
  }

  const seen = new Set<string>();
  const queue = startIds.filter((id) => nodeIds.has(id));

  while (queue.length > 0) {
    const id = queue.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    for (const next of outgoing.get(id) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }

  return {
    nodes: nodes.filter((node) => seen.has(node.id)),
    connections: connections.filter(
      (connection) =>
        seen.has(connection.fromNodeId) && seen.has(connection.toNodeId),
    ),
  };
};

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  if (nodes.length === 0) return [];
  if (connections.length === 0) return nodes;

  // Directed edges: source runs before target.
  const edges: [string, string][] = connections.map((connection) => [
    connection.fromNodeId,
    connection.toNodeId,
  ]);

  let sortedNodeIds: string[];

  try {
    sortedNodeIds = [...new Set(toposort(edges))];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle!");
    }
    throw error;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted = sortedNodeIds.flatMap((id) => {
    const node = nodeMap.get(id);
    return node ? [node] : [];
  });
  const seen = new Set(sorted.map((node) => node.id));
  const disconnected = nodes.filter((node) => !seen.has(node.id));
  return [...sorted, ...disconnected];
};

export const shouldUseInngest = () => {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;
  if (eventKey && signingKey) {
    return true;
  }
  return (
    process.env.NODE_ENV !== "production" && Boolean(process.env.INNGEST_DEV)
  );
};

export const sendWorkflowExecution = async ({
  eventId,
  ...data
}: {
  workflowId: string;
  eventId?: string;
  [key: string]: unknown;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
    id: eventId ?? createId(),
  });
};
