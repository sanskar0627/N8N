import type { Edge, Node } from "@xyflow/react";

const cloneJson = (value: unknown): Record<string, unknown> => {
  try {
    const cloned = JSON.parse(JSON.stringify(value ?? {}));
    if (cloned && typeof cloned === "object" && !Array.isArray(cloned)) {
      return cloned as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
};

export const serializeWorkflowCanvas = (nodes: Node[], edges: Edge[]) => ({
  nodes: nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: cloneJson(node.data),
  })),
  edges: edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  })),
});
