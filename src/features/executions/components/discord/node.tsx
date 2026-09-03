"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { NodeType } from "@/generated/prisma/enums";
import { WebhookMessageNode } from "../webhook-message/node";
import type { WebhookMessageData } from "../webhook-message/schema";

type DiscordNodeType = Node<WebhookMessageData>;

export const DiscordNode = memo((props: NodeProps<DiscordNodeType>) => (
  <WebhookMessageNode nodeProps={props} nodeType={NodeType.DISCORD} />
));

DiscordNode.displayName = "DiscordNode";
