"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { workflowNodeStatusChannelName } from "@/inngest/channels/workflow-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchWorkflowNodeStatusToken } from "./actions";
import { AI_NODE_CONFIG, type AiNodeType } from "./config";
import { AiNodeDialog } from "./dialog";
import type { AiNodeData } from "./schema";

type AiTextNode = Node<AiNodeData>;

interface AiTextNodeProps {
  nodeProps: NodeProps<AiTextNode>;
  nodeType: AiNodeType;
}

export const AiTextNode = ({ nodeProps, nodeType }: AiTextNodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { workflowId } = useParams<{ workflowId: string }>();
  const { setNodes } = useReactFlow();
  const config = AI_NODE_CONFIG[nodeType];
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

  const handleSubmit = (values: AiNodeData) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeProps.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const prompt = nodeProps.data.userPrompt?.trim();
  const promptPreview =
    prompt && prompt.length > 48 ? `${prompt.slice(0, 48)}…` : prompt;
  const description = promptPreview
    ? `${nodeProps.data.model || config.defaultModel}: ${promptPreview}`
    : "Not configured";

  return (
    <>
      <AiNodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workflowId={workflowId}
        nodeId={nodeProps.id}
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
