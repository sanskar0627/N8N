"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ExecutionStatus } from "@/generated/prisma/enums";
import { useSuspenseExecution } from "../hooks/use-executions";
import {
  formatExecutionDuration,
  formatExecutionStatus,
} from "../lib/format-execution";

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2Icon className="size-5 text-green-600" />;
    case "FAILED":
      return <XCircleIcon className="size-5 text-red-600" />;
    case "RUNNING":
      return <Loader2Icon className="size-5 animate-spin text-blue-600" />;
    default:
      return <ClockIcon className="size-5 text-muted-foreground" />;
  }
};

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const duration = formatExecutionDuration(
    execution.startedAt,
    execution.completedAt,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/executions"
          prefetch
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to executions
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {formatExecutionStatus(execution.status)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Run of {execution.workflow.name}
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <CardTitle>{formatExecutionStatus(execution.status)}</CardTitle>
              <CardDescription>
                Started{" "}
                {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Workflow
              </p>
              <Link
                href={`/workflows/${execution.workflow.id}`}
                className="text-sm text-primary hover:underline"
                prefetch
              >
                {execution.workflow.name}
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <p className="text-sm">
                {formatExecutionStatus(execution.status)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Started
              </p>
              <p className="text-sm">
                {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
              </p>
            </div>
            {execution.completedAt ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-sm">
                  {formatDistanceToNow(execution.completedAt, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ) : null}
            {duration ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-sm">{duration}</p>
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Event ID
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {execution.inngestEventId}
              </p>
            </div>
          </div>

          {execution.error ? (
            <div className="space-y-3 rounded-md bg-red-50 p-4 dark:bg-red-950/40">
              <div>
                <p className="mb-2 text-sm font-medium text-red-900 dark:text-red-100">
                  Error
                </p>
                <p className="font-mono text-sm break-words text-red-800 dark:text-red-200">
                  {execution.error}
                </p>
              </div>
              {execution.errorStack ? (
                <Collapsible
                  open={showStackTrace}
                  onOpenChange={setShowStackTrace}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-900 hover:bg-red-100 dark:text-red-100 dark:hover:bg-red-900/40"
                    >
                      {showStackTrace ? "Hide stack trace" : "Show stack trace"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 max-h-80 overflow-auto rounded bg-red-100 p-2 font-mono text-xs text-red-800 dark:bg-red-900/50 dark:text-red-100">
                      {execution.errorStack}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </div>
          ) : null}

          {execution.output ? (
            <div className="rounded-md bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Output</p>
              <pre className="max-h-96 overflow-auto font-mono text-xs">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
