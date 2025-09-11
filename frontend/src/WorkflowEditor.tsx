import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  MiniMap, 
  Controls, 
  Background,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import './editor.css'; // Create a CSS file for your editor

const initialNodes: Node[] = [
  { id: '1', data: { label: 'Webhook' }, position: { x: 250, y: 5 } },
];

const initialEdges: Edge[] = [];

function WorkflowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback((changes: NodeChange[]) => 
    setNodes((nds) => applyNodeChanges(changes, nds)), []
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );

  const onConnect = useCallback((params: Edge | Connection) => 
    setEdges((eds) => addEdge(params, eds)), []
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default WorkflowEditor;