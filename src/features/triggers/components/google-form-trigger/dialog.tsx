"use client";

import { useMutation } from "@tanstack/react-query";
import { CopyIcon, Loader2Icon, RotateCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { generateGoogleFormScript } from "./script";

interface GoogleFormTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  nodeId: string;
}

const copyText = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Could not copy to the clipboard");
  }
};

export const GoogleFormTriggerDialog = ({
  open,
  onOpenChange,
  workflowId,
  nodeId,
}: GoogleFormTriggerDialogProps) => {
  const trpc = useTRPC();
  const [origin, setOrigin] = useState("");
  const secretMutation = useMutation(
    trpc.workflows.generateGoogleFormSecret.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setOrigin(window.location.origin);
    secretMutation.mutate({ workflowId, nodeId, rotate: false });
  }, [open, workflowId, nodeId, secretMutation.mutate]);

  const webhookUrl = useMemo(() => {
    if (!origin) {
      return "";
    }

    const url = new URL("/api/webhooks/google-form", origin);
    url.searchParams.set("workflowId", workflowId);
    url.searchParams.set("nodeId", nodeId);
    return url.toString();
  }, [nodeId, origin, workflowId]);

  const copyScript = () => {
    const secret = secretMutation.data?.secret;
    if (!webhookUrl || !secret) {
      toast.error("Save the workflow before copying the script");
      return;
    }

    return copyText(
      generateGoogleFormScript(webhookUrl, secret),
      "Google Apps Script copied",
    );
  };

  const rotateSecret = () => {
    if (
      !window.confirm(
        "Rotate this webhook secret? The currently installed Apps Script will stop working.",
      )
    ) {
      return;
    }

    secretMutation.mutate(
      { workflowId, nodeId, rotate: true },
      { onSuccess: () => toast.success("Webhook secret rotated") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Google Form Trigger</DialogTitle>
          <DialogDescription>
            Run this workflow whenever a response is submitted to your Google
            Form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`google-form-webhook-${nodeId}`}>Webhook URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`google-form-webhook-${nodeId}`}
                value={webhookUrl}
                placeholder="Save the workflow to create the webhook URL"
                readOnly
                className="min-w-0 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!webhookUrl}
                onClick={() => copyText(webhookUrl, "Webhook URL copied")}
                className="sm:shrink-0"
              >
                <CopyIcon className="size-4" />
                Copy URL
              </Button>
            </div>
          </div>

          <section className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <h3 className="text-sm font-medium">Setup instructions</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Open your Google Form and choose Script editor.</li>
              <li>Replace the editor contents with the generated script.</li>
              <li>Save the Apps Script project.</li>
              <li>Open Triggers and add an onFormSubmit trigger.</li>
              <li>Authorize the script when Google prompts you.</li>
            </ol>
          </section>

          <section className="space-y-3 rounded-lg border border-primary/20 bg-muted/40 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-medium">Google Apps Script</h3>
                <p className="text-xs text-muted-foreground">
                  Includes a private webhook secret and retries failed requests.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={secretMutation.isPending}
                onClick={rotateSecret}
              >
                <RotateCwIcon className="size-4" />
                Rotate secret
              </Button>
            </div>
            <Button
              type="button"
              onClick={copyScript}
              disabled={
                secretMutation.isPending || !secretMutation.data?.secret
              }
              className="w-full"
            >
              {secretMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {secretMutation.isPending
                ? "Preparing secure script..."
                : "Copy Google Apps Script"}
            </Button>
          </section>

          <section className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <h3 className="text-sm font-medium">Available variables</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <code className="break-all text-foreground">
                  {"{{googleForm.formTitle}}"}
                </code>{" "}
                — form title
              </li>
              <li>
                <code className="break-all text-foreground">
                  {"{{googleForm.respondentEmail}}"}
                </code>{" "}
                — respondent email when email collection is enabled
              </li>
              <li>
                <code className="break-all text-foreground">
                  {"{{googleForm.timestamp}}"}
                </code>{" "}
                — ISO submission time
              </li>
              <li>
                <code className="break-all text-foreground">
                  {'{{lookup googleForm.responses "Question Name"}}'}
                </code>{" "}
                — one answer by question title
              </li>
              <li>
                <code className="break-all text-foreground">
                  {"{{json googleForm.responses}}"}
                </code>{" "}
                — all answers as JSON
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
