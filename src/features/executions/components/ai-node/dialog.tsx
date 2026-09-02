"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AddCredentialDialog } from "@/features/credentials/components/add-credential-dialog";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { AI_NODE_CONFIG, type AiNodeType } from "./config";
import {
  type AiNodeData,
  type AiNodeFormValues,
  aiNodeFormSchema,
} from "./schema";

interface AiNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: AiNodeType;
  defaultValues?: Partial<AiNodeData>;
  onSubmit: (values: AiNodeData) => void;
}

export const AiNodeDialog = ({
  open,
  onOpenChange,
  nodeType,
  defaultValues,
  onSubmit,
}: AiNodeDialogProps) => {
  const config = AI_NODE_CONFIG[nodeType];
  const [addCredentialOpen, setAddCredentialOpen] = useState(false);
  const credentials = useCredentialsByType(config.credentialType, open);
  const form = useForm<AiNodeFormValues>({
    resolver: zodResolver(aiNodeFormSchema),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      credentialId: defaultValues?.credentialId ?? "",
      model: defaultValues?.model ?? config.defaultModel,
      systemPrompt: defaultValues?.systemPrompt ?? "",
      userPrompt: defaultValues?.userPrompt ?? "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstCredentialId = credentials.data?.[0]?.id ?? "";
    form.reset({
      variableName: defaultValues?.variableName ?? "",
      credentialId: defaultValues?.credentialId || firstCredentialId,
      model: defaultValues?.model ?? config.defaultModel,
      systemPrompt: defaultValues?.systemPrompt ?? "",
      userPrompt: defaultValues?.userPrompt ?? "",
    });
  }, [config.defaultModel, credentials.data, defaultValues, form, open]);

  const handleSubmit = (values: AiNodeFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const variableName = form.watch("variableName") || "aiResult";

  return (
    <>
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
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.credentialLabel}</FormLabel>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={credentials.isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                credentials.isLoading
                                  ? "Loading credentials..."
                                  : "Select a credential"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {credentials.data?.map((credential) => (
                            <SelectItem
                              key={credential.id}
                              value={credential.id}
                            >
                              {credential.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddCredentialOpen(true)}
                        className="sm:w-auto"
                      >
                        <PlusIcon className="size-4" />
                        Add
                      </Button>
                    </div>
                    <FormDescription>
                      Reuse a saved {config.name} credential instead of pasting
                      a key on every node.
                    </FormDescription>
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
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AddCredentialDialog
        open={addCredentialOpen}
        onOpenChange={setAddCredentialOpen}
        type={config.credentialType}
        onCreated={(credential) => {
          form.setValue("credentialId", credential.id, {
            shouldValidate: true,
          });
        }}
      />
    </>
  );
};
