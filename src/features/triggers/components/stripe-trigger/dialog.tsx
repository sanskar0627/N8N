"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  ShieldAlertIcon,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

interface StripeTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  nodeId: string;
  defaultEventTypes?: string[];
  onSaved: (allowedEventTypes: string[]) => void;
}

const parseEventTypes = (value: string) =>
  value
    .split(/[\n,]/)
    .map((eventType) => eventType.trim())
    .filter(Boolean);

export const StripeTriggerDialog = ({
  open,
  onOpenChange,
  workflowId,
  nodeId,
  defaultEventTypes = [],
  onSaved,
}: StripeTriggerDialogProps) => {
  const trpc = useTRPC();
  const [origin, setOrigin] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [eventTypes, setEventTypes] = useState(defaultEventTypes.join("\n"));

  const configQuery = useQuery({
    ...trpc.workflows.getStripeWebhookConfig.queryOptions({
      workflowId,
      nodeId,
    }),
    enabled: open,
    retry: false,
  });
  const saveConfig = useMutation(
    trpc.workflows.saveStripeWebhookConfig.mutationOptions({
      onSuccess: (data) => {
        setWebhookSecret("");
        setEventTypes(data.allowedEventTypes.join("\n"));
        onSaved(data.allowedEventTypes);
        toast.success("Stripe webhook settings saved");
        configQuery.refetch();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  useEffect(() => {
    if (open) {
      setOrigin(window.location.origin);
    }
  }, [open]);

  useEffect(() => {
    if (configQuery.data) {
      setEventTypes(configQuery.data.allowedEventTypes.join("\n"));
    }
  }, [configQuery.data]);

  const webhookUrl = useMemo(() => {
    if (!origin) {
      return "";
    }

    const url = new URL("/api/webhooks/stripe", origin);
    url.searchParams.set("workflowId", workflowId);
    url.searchParams.set("nodeId", nodeId);
    return url.toString();
  }, [nodeId, origin, workflowId]);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Stripe webhook URL copied");
    } catch {
      toast.error("Could not copy to the clipboard");
    }
  };

  const handleSave = () => {
    saveConfig.mutate({
      workflowId,
      nodeId,
      webhookSecret: webhookSecret.trim() || undefined,
      allowedEventTypes: parseEventTypes(eventTypes),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stripe Trigger</DialogTitle>
          <DialogDescription>
            Receive verified Stripe webhook events and run this workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`stripe-webhook-url-${nodeId}`}>Webhook URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`stripe-webhook-url-${nodeId}`}
                value={webhookUrl}
                readOnly
                className="min-w-0 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!webhookUrl}
                onClick={copyWebhookUrl}
                className="sm:shrink-0"
              >
                <CopyIcon className="size-4" />
                Copy URL
              </Button>
            </div>
          </div>

          <section className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <h3 className="text-sm font-medium">Stripe setup</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Open Developers → Webhooks in your Stripe Dashboard.</li>
              <li>Add a destination and paste the webhook URL above.</li>
              <li>Select the events this workflow should receive.</li>
              <li>Create the endpoint and reveal its signing secret.</li>
              <li>Paste the whsec_ signing secret below and save.</li>
            </ol>
          </section>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`stripe-secret-${nodeId}`}>
                Webhook signing secret
              </Label>
              {configQuery.data?.configured ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2Icon className="size-3.5" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <ShieldAlertIcon className="size-3.5" />
                  Required
                </span>
              )}
            </div>
            <Input
              id={`stripe-secret-${nodeId}`}
              type="password"
              autoComplete="off"
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
              placeholder={
                configQuery.data?.configured
                  ? "Leave blank to keep the current secret"
                  : "whsec_..."
              }
            />
            <p className="text-xs text-muted-foreground">
              This is the endpoint signing secret, not a Stripe API key. It is
              never returned to the editor after saving.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`stripe-events-${nodeId}`}>
              Allowed event types
            </Label>
            <Textarea
              id={`stripe-events-${nodeId}`}
              value={eventTypes}
              onChange={(event) => setEventTypes(event.target.value)}
              placeholder={
                "checkout.session.completed\npayment_intent.succeeded\ninvoice.paid"
              }
              className="min-h-28 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Enter one event type per line. Leave empty to accept every event
              selected in Stripe.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saveConfig.isPending || configQuery.isLoading}
            className="w-full"
          >
            {(saveConfig.isPending || configQuery.isLoading) && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Save Stripe settings
          </Button>

          <section className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <h3 className="text-sm font-medium">Available variables</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                ["{{stripe.eventType}}", "event type"],
                ["{{stripe.amount}}", "normalized amount when available"],
                ["{{stripe.currency}}", "currency when available"],
                ["{{stripe.customerId}}", "customer ID when available"],
                ["{{json stripe.raw}}", "complete Stripe object as JSON"],
              ].map(([variable, description]) => (
                <li key={variable}>
                  <code className="break-all text-foreground">{variable}</code>{" "}
                  — {description}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
