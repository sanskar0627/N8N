"use client";

import type { NodeProps } from "@xyflow/react";
import { useParams } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { googleFormTriggerChannelName } from "@/inngest/channels/google-form-trigger";
import { BaseTriggerNode } from "../base-trigger-node";
import { fetchGoogleFormTriggerRealtimeToken } from "./actions";
import { GoogleFormTriggerDialog } from "./dialog";

export const GoogleFormTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { workflowId } = useParams<{ workflowId: string }>();
  const refreshToken = useCallback(
    () => fetchGoogleFormTriggerRealtimeToken(workflowId),
    [workflowId],
  );
  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: googleFormTriggerChannelName(workflowId),
    topic: "status",
    refreshToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <GoogleFormTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workflowId={workflowId}
        nodeId={props.id}
      />
      <BaseTriggerNode
        {...props}
        icon="/logos/googleform.svg"
        name="Google Form"
        description="When a response is submitted"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

GoogleFormTriggerNode.displayName = "GoogleFormTriggerNode";
