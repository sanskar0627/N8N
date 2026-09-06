import { NodeType } from "@/generated/prisma";

import type { NodeTypes } from "@xyflow/react";

import { InitialNode } from "@/components/initial-node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
