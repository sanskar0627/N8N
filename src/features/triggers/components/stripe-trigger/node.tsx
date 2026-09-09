"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useParams } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { fetchWorkflowNodeStatusToken } from "@/features/executions/lib/realtime-token";
import { workflowNodeStatusChannelName } from "@/inngest/channels/workflow-node-status";
import { BaseTriggerNode } from "../base-trigger-node";
import { StripeTriggerDialog } from "./dialog";

type StripeTriggerNodeData = {
  allowedEventTypes?: string[];
};

type StripeTriggerNodeType = Node<StripeTriggerNodeData>;

export const StripeTriggerNode = memo(
  (props: NodeProps<StripeTriggerNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { workflowId } = useParams<{ workflowId: string }>();
    const { setNodes } = useReactFlow();
    const refreshToken = useCallback(
      () => fetchWorkflowNodeStatusToken(workflowId),
      [workflowId],
    );
    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: workflowNodeStatusChannelName(workflowId),
      topic: "status",
      refreshToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);
    const handleSaved = (allowedEventTypes: string[]) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === props.id
            ? {
                ...node,
                data: { ...node.data, allowedEventTypes },
              }
            : node,
        ),
      );
    };

    return (
      <>
        <StripeTriggerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          workflowId={workflowId}
          nodeId={props.id}
          defaultEventTypes={props.data.allowedEventTypes}
          onSaved={handleSaved}
        />
        <BaseTriggerNode
          {...props}
          icon="/logos/stripe.svg"
          name="Stripe"
          description={
            props.data.allowedEventTypes?.length
              ? `${props.data.allowedEventTypes.length} event types`
              : "When a verified event is received"
          }
          status={nodeStatus}
          onSettings={handleOpenSettings}
          onDoubleClick={handleOpenSettings}
        />
      </>
    );
  },
);

StripeTriggerNode.displayName = "StripeTriggerNode";
