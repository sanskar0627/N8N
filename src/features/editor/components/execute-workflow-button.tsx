import { FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import { useExecuteWorkflow, useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "@/features/editor/store/atoms";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const updateWorkflow = useUpdateWorkflow();
  const executeWorkflow = useExecuteWorkflow();

  const isPending = updateWorkflow.isPending || executeWorkflow.isPending;

  const handleExecute = async () => {
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

    try {
      await updateWorkflow.mutateAsync({ id: workflowId, nodes, edges });
      executeWorkflow.mutate({ id: workflowId });
    } catch {
      // save failed — toast already shown by useUpdateWorkflow
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={isPending || !editor}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <FlaskConicalIcon className="size-4" />
      )}
      {updateWorkflow.isPending ? "Saving..." : executeWorkflow.isPending ? "Executing..." : "Execute workflow"}
    </Button>
  );
};
