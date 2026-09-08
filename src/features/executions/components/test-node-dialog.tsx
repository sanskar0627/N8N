"use client";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  PlayIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  buildContextFromVariables,
  extractTemplateVariables,
} from "@/features/executions/lib/template-variables";
import { useAtomValue } from "jotai";
import { editorAtom } from "@/features/editor/store/atoms";
import { useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { useExecuteNode } from "../hooks/use-execute-node";

interface TestNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  nodeId: string;
  nodeType?: string;
  nodeData: Record<string, unknown>;
  nodeName: string;
}

function formatOutput(output: unknown): string {
  if (output === undefined || output === null) return "No output";

  let str: string;
  if (typeof output === "string") {
    str = output;
  } else {
    try {
      str = JSON.stringify(output, null, 2);
    } catch {
      str = String(output);
    }
  }

  return str;
}

export const TestNodeDialog = ({
  open,
  onOpenChange,
  workflowId,
  nodeId,
  nodeType,
  nodeData,
  nodeName,
}: TestNodeDialogProps) => {
  const editor = useAtomValue(editorAtom);
  const updateWorkflow = useUpdateWorkflow();
  const executeNode = useExecuteNode();
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );
  const [copied, setCopied] = useState(false);

  const [executionResult, setExecutionResult] = useState<{
    status: "idle" | "running" | "success" | "error";
    output?: string;
    error?: string;
  }>({ status: "idle" });

  const variables = useMemo(
    () => extractTemplateVariables(nodeData),
    [nodeData],
  );

  useEffect(() => {
    if (open) {
      setExecutionResult({ status: "idle" });
      setCopied(false);
      const initialValues: Record<string, string> = {};
      variables.forEach((v) => {
        initialValues[v] = "";
      });
      setVariableValues(initialValues);
    }
  }, [open, variables]);

  const handleRunTest = async () => {
    const mockContext = buildContextFromVariables(variableValues);
    setExecutionResult({ status: "running" });
    setCopied(false);

    // auto-save the workflow so the DB has the latest node configs
    if (editor) {
      try {
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
        await updateWorkflow.mutateAsync({ id: workflowId, nodes, edges });
      } catch {
        // save failed, still try to run with provided nodeData as fallback
      }
    }

    executeNode.mutate(
      { workflowId, nodeId, mockContext, nodeType, nodeData },
      {
        onSuccess: (data) => {
          setExecutionResult({
            status: "success",
            output: formatOutput(data.output),
          });
        },
        onError: (error) => {
          setExecutionResult({
            status: "error",
            error: error.message,
          });
        },
      },
    );
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleCopyOutput = async () => {
    if (executionResult.output) {
      try {
        await navigator.clipboard.writeText(executionResult.output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error("Failed to copy to clipboard");
      }
    }
  };

  const isRunning =
    executionResult.status === "running" || updateWorkflow.isPending || executeNode.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayIcon className="size-4" />
            Test Node: {nodeName}
          </DialogTitle>
          <DialogDescription>
            {variables.length > 0
              ? "Enter sample text or JSON values for the template variables used in this node."
              : "This node has no template variables. Click Run to test with empty context."}
          </DialogDescription>
        </DialogHeader>

        {variables.length > 0 && (
          <ScrollArea className="max-h-[200px] pr-4">
            <div className="space-y-4">
              {variables.map((varName) => (
                <div key={varName} className="space-y-2">
                  <Label htmlFor={varName} className="font-mono text-sm">
                    {`{{${varName}}}`}
                  </Label>
                  <Input
                    id={varName}
                    placeholder={`Enter text or JSON for ${varName}`}
                    value={variableValues[varName] || ""}
                    onChange={(e) =>
                      handleVariableChange(varName, e.target.value)
                    }
                    disabled={isRunning}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {executionResult.status !== "idle" && (
          <div
            className={`mt-6 rounded-lg border shadow-sm ${
              executionResult.status === "success"
                ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10"
                : executionResult.status === "error"
                  ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10"
                  : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                {executionResult.status === "running" && (
                  <>
                    <Loader2Icon className="size-4 animate-spin text-blue-600" />
                    <span className="text-muted-foreground">Running...</span>
                  </>
                )}
                {executionResult.status === "success" && (
                  <>
                    <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">
                      Success
                    </span>
                  </>
                )}
                {executionResult.status === "error" && (
                  <>
                    <AlertCircleIcon className="size-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300">
                      Error
                    </span>
                  </>
                )}
              </div>
              {executionResult.status === "success" &&
                executionResult.output && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyOutput}
                    className="h-8 px-2.5 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {copied ? (
                      <CheckIcon className="size-4 text-green-600" />
                    ) : (
                      <CopyIcon className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
            </div>
            {(executionResult.output || executionResult.error) && (
              <ScrollArea className="h-[300px] w-full rounded-b-lg bg-white/50 dark:bg-black/20">
                <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
                  {executionResult.status === "error"
                    ? executionResult.error
                    : executionResult.output}
                </pre>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleRunTest} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 size-4" />
                Run Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
