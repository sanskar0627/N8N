"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { AiTextNode } from "@/features/executions/components/ai-node/node";
import type { AiNodeData } from "@/features/executions/components/ai-node/schema";
import { NodeType } from "@/generated/prisma/enums";

type AnthropicNodeType = Node<AiNodeData>;

export const AnthropicNode = memo((props: NodeProps<AnthropicNodeType>) => (
  <AiTextNode nodeProps={props} nodeType={NodeType.ANTHROPIC} />
));

AnthropicNode.displayName = "AnthropicNode";
