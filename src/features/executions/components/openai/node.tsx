"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { AiTextNode } from "@/features/executions/components/ai-node/node";
import type { AiNodeData } from "@/features/executions/components/ai-node/schema";
import { NodeType } from "@/generated/prisma/enums";

type OpenAiNodeType = Node<AiNodeData>;

export const OpenAiNode = memo((props: NodeProps<OpenAiNodeType>) => (
  <AiTextNode nodeProps={props} nodeType={NodeType.OPENAI} />
));

OpenAiNode.displayName = "OpenAiNode";
