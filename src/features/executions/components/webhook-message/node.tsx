"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { fetchWorkflowNodeStatusToken } from "@/features/executions/lib/realtime-token";
import { workflowNodeStatusChannelName } from "@/inngest/channels/workflow-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { WEBHOOK_MESSAGE_CONFIG, type WebhookMessageNodeType } from "./config";
import { WebhookMessageDialog } from "./dialog";
import type { WebhookMessageData } from "./schema";

type WebhookMessageFlowNode = Node<WebhookMessageData>;

interface WebhookMessageNodeProps {
  nodeProps: NodeProps<WebhookMessageFlowNode>;
  nodeType: WebhookMessageNodeType;
}

export const WebhookMessageNode = ({
  nodeProps,
  nodeType,
}: WebhookMessageNodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { workflowId } = useParams<{ workflowId: string }>();
  const { setNodes } = useReactFlow();
  const config = WEBHOOK_MESSAGE_CONFIG[nodeType];
  const refreshToken = useCallback(
    () => fetchWorkflowNodeStatusToken(workflowId),
    [workflowId],
  );
  const nodeStatus = useNodeStatus({
    nodeId: nodeProps.id,
    channel: workflowNodeStatusChannelName(workflowId),
    topic: "status",
    refreshToken,
  });

  const handleSubmit = (values: WebhookMessageData) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeProps.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const content = nodeProps.data.content?.trim();
  const contentPreview =
    content && content.length > 48 ? `${content.slice(0, 48)}…` : content;
  const description = contentPreview
    ? nodeProps.data.variableName
      ? `${contentPreview} → ${nodeProps.data.variableName}`
      : contentPreview
    : "Not configured";

  return (
    <>
      <WebhookMessageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nodeType={nodeType}
        defaultValues={nodeProps.data}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...nodeProps}
        icon={config.icon}
        name={config.name}
        description={description}
        status={nodeStatus}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
        nodeData={nodeProps.data as Record<string, unknown>}
      />
    </>
  );
};
