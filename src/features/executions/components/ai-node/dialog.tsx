"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { AI_NODE_CONFIG, type AiNodeType } from "./config";
import {
  type AiNodeData,
  type AiNodeFormValues,
  aiNodeFormSchema,
} from "./schema";

interface AiNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  nodeId: string;
  nodeType: AiNodeType;
  defaultValues?: Partial<AiNodeData>;
  onSubmit: (values: AiNodeData) => void;
}

export const AiNodeDialog = ({
  open,
  onOpenChange,
  workflowId,
  nodeId,
  nodeType,
  defaultValues,
  onSubmit,
}: AiNodeDialogProps) => {
  const trpc = useTRPC();
  const config = AI_NODE_CONFIG[nodeType];
  const secretStatus = useQuery({
    ...trpc.workflows.getAiNodeSecretStatus.queryOptions({
      workflowId,
      nodeId,
      nodeType,
    }),
    enabled: open,
    retry: false,
  });
  const saveApiKey = useMutation(
    trpc.workflows.saveAiNodeApiKey.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );
  const form = useForm<AiNodeFormValues>({
    resolver: zodResolver(aiNodeFormSchema),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      apiKey: "",
      model: defaultValues?.model ?? config.defaultModel,
      systemPrompt: defaultValues?.systemPrompt ?? "",
      userPrompt: defaultValues?.userPrompt ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues?.variableName ?? "",
        apiKey: "",
        model: defaultValues?.model ?? config.defaultModel,
        systemPrompt: defaultValues?.systemPrompt ?? "",
        userPrompt: defaultValues?.userPrompt ?? "",
      });
    }
  }, [config.defaultModel, defaultValues, form, open]);

  const handleSubmit = async (values: AiNodeFormValues) => {
    const apiKey = values.apiKey?.trim();
    if (!apiKey && !secretStatus.data?.configured) {
      form.setError("apiKey", {
        message: "API key is required. Save the node first if it is new.",
      });
      return;
    }

    if (apiKey) {
      try {
        await saveApiKey.mutateAsync({
          workflowId,
          nodeId,
          nodeType,
          apiKey,
        });
      } catch {
        return;
      }
    }

    onSubmit({
      variableName: values.variableName,
      model: values.model,
      systemPrompt: values.systemPrompt,
      userPrompt: values.userPrompt,
    });
    onOpenChange(false);
  };

  const variableName = form.watch("variableName") || "aiResult";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.name}</DialogTitle>
          <DialogDescription>
            Configure text generation, prompts, and the output variable.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-2 space-y-6"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable name</FormLabel>
                  <FormControl>
                    <Input placeholder="aiResult" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference the generated text later as{" "}
                    <code className="break-all">
                      {`{{${variableName}.${config.outputField}}}`}
                    </code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{config.credentialLabel}</FormLabel>
                    {secretStatus.data?.configured && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2Icon className="size-3.5" />
                        Configured
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div className="relative">
                      <KeyRoundIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        autoComplete="off"
                        placeholder={
                          secretStatus.data?.configured
                            ? "Leave blank to keep the current key"
                            : config.credentialPlaceholder
                        }
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The key is saved server-side and is not returned to the
                    editor.
                  </FormDescription>
                  {secretStatus.error && (
                    <p className="text-xs text-amber-600">
                      Save the workflow before adding an API key.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={config.defaultModel}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a model ID supported by this provider.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant."
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional instructions. Supports {"{{variables}}"} and{" "}
                    {"{{json variable}}"}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize {{previousRequest.httpResponse.data}}"
                      className="min-h-36 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports nested workflow variables and the json helper.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveApiKey.isPending}>
                {saveApiKey.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
