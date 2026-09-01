"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { AiTextNode } from "@/features/executions/components/ai-node/node";
import type { AiNodeData } from "@/features/executions/components/ai-node/schema";
import { NodeType } from "@/generated/prisma/enums";

type GeminiNodeType = Node<AiNodeData>;

export const GeminiNode = memo((props: NodeProps<GeminiNodeType>) => (
  <AiTextNode nodeProps={props} nodeType={NodeType.GEMINI} />
));

GeminiNode.displayName = "GeminiNode";
