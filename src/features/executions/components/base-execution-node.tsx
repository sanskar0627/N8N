"use client";

import { type NodeProps, Position, useReactFlow } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { WorkflowNode } from "@/components/workflow-node";
import {
  type NodeStatus,
  NodeStatusIndicator,
} from "@/components/react-flow/node-status-indicator";
import { TestNodeDialog } from "./test-node-dialog";

interface BaseExecutionNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  onSettings?: () => void;
  onDoubleClick?: () => void;
  nodeData?: Record<string, unknown>;
}

export const BaseExecutionNode = memo(
  ({
    id,
    type,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    onSettings,
    onDoubleClick,
    nodeData = {},
  }: BaseExecutionNodeProps) => {
    const params = useParams();
    const workflowId = params.workflowId as string | undefined;
    const { setNodes, setEdges } = useReactFlow();
    const [testDialogOpen, setTestDialogOpen] = useState(false);

    const handleDelete = () => {
      setNodes((currentNodes) =>
        currentNodes.filter((node) => node.id !== id),
      );
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        ),
      );
    };

    const handleTest = workflowId
      ? () => setTestDialogOpen(true)
      : undefined;

    return (
      <>
        {workflowId && (
          <TestNodeDialog
            open={testDialogOpen}
            onOpenChange={setTestDialogOpen}
            workflowId={workflowId}
            nodeId={id}
            nodeType={type}
            nodeData={nodeData}
            nodeName={name}
          />
        )}
        <WorkflowNode
          name={name}
          description={description}
          onDelete={handleDelete}
          onSettings={onSettings}
          onTest={handleTest}
        >
          <NodeStatusIndicator status={status} variant="border">
            <BaseNode onDoubleClick={onDoubleClick} status={status}>
              <BaseNodeContent>
                {typeof Icon === "string" ? (
                  <Image src={Icon} alt={name} width={16} height={16} />
                ) : (
                  <Icon className="size-4 text-muted-foreground" />
                )}
                {children}
                <BaseHandle
                  id="target-1"
                  type="target"
                  position={Position.Left}
                />
                <BaseHandle
                  id="source-1"
                  type="source"
                  position={Position.Right}
                />
              </BaseNodeContent>
            </BaseNode>
          </NodeStatusIndicator>
        </WorkflowNode>
      </>
    );
  },
);

BaseExecutionNode.displayName = "BaseExecutionNode";
