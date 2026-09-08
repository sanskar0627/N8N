"use client";

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ErrorView, LoadingView } from "@/components/entity-components";
import { nodeComponents } from "@/config/node-components";
import { editorAtom } from "@/features/editor/store/atoms";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
import { AddNodeButton } from "./add-node-button";
import { ExecuteWorkflowButton } from "./execute-workflow-button";

import "@xyflow/react/dist/style.css";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

const snapGrid: [number, number] = [20, 20];

function SyncEditorInstance() {
  const instance = useReactFlow();
  const [, setEditor] = useAtom(editorAtom);

  useEffect(() => {
    setEditor(instance);
    return () => setEditor(null);
  }, [instance, setEditor]);

  return null;
}

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);
  const [loadedWorkflowId, setLoadedWorkflowId] = useState(workflowId);

  if (loadedWorkflowId !== workflowId) {
    setLoadedWorkflowId(workflowId);
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
  }

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const hasManualTrigger = useMemo(
    () => nodes.some((node) => node.type === "MANUAL_TRIGGER"),
    [nodes],
  );

  return (
    <div className="size-full">
      <ReactFlow
        key={workflowId}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        snapToGrid
        snapGrid={snapGrid}
        fitView
      >
        <SyncEditorInstance />
        <Background gap={22} size={1.4} color="#c8cdd6" />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
