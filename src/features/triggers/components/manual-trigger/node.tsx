"use client";

import type { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { fetchWorkflowNodeStatusToken } from "@/features/executions/lib/realtime-token";
import { workflowNodeStatusChannelName } from "@/inngest/channels/workflow-node-status";
import { BaseTriggerNode } from "../base-trigger-node";
import { ManualTriggerDialog } from "./dialog";

export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { workflowId } = useParams<{ workflowId: string }>();
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

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

ManualTriggerNode.displayName = "ManualTriggerNode";
