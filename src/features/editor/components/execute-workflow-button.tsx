import { useReactFlow } from "@xyflow/react";
import { FlaskConicalIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { serializeWorkflowCanvas } from "@/features/editor/lib/serialize-canvas";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const { getNodes, getEdges } = useReactFlow();
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = () => {
    const { nodes, edges } = serializeWorkflowCanvas(getNodes(), getEdges());
    if (nodes.length === 0) {
      toast.error("Canvas has no nodes to execute");
      return;
    }

    executeWorkflow.mutate({ id: workflowId, nodes, edges });
  };

  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={executeWorkflow.isPending}
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
