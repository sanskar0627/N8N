"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { NodeType } from "@/generated/prisma/enums";
import { WebhookMessageNode } from "../webhook-message/node";
import type { WebhookMessageData } from "../webhook-message/schema";

type SlackNodeType = Node<WebhookMessageData>;

export const SlackNode = memo((props: NodeProps<SlackNodeType>) => (
  <WebhookMessageNode nodeProps={props} nodeType={NodeType.SLACK} />
));

SlackNode.displayName = "SlackNode";
