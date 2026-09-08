import { FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "@/features/editor/store/atoms";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = () => {
    if (!editor) return;

    const nodes = editor.getNodes().map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    }));

    const edges = editor.getEdges().map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

    executeWorkflow.mutate({ id: workflowId, nodes, edges });
  };

  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={executeWorkflow.isPending || !editor}
    >
      {executeWorkflow.isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <FlaskConicalIcon className="size-4" />
      )}
      {executeWorkflow.isPending ? "Executing..." : "Execute workflow"}
    </Button>
  );
};
