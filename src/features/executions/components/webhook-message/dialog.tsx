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
import { getCredentialTypeForNode } from "@/features/credentials/config";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { WEBHOOK_MESSAGE_CONFIG, type WebhookMessageNodeType } from "./config";
import {
  type WebhookMessageData,
  type WebhookMessageFormValues,
  webhookMessageFormSchema,
} from "./schema";

interface WebhookMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: WebhookMessageNodeType;
  defaultValues?: Partial<WebhookMessageData>;
  onSubmit: (values: WebhookMessageData) => void;
}

export const WebhookMessageDialog = ({
  open,
  onOpenChange,
  nodeType,
  defaultValues,
  onSubmit,
}: WebhookMessageDialogProps) => {
  const config = WEBHOOK_MESSAGE_CONFIG[nodeType];
  const credentialType = getCredentialTypeForNode(nodeType);
  const [addCredentialOpen, setAddCredentialOpen] = useState(false);
  const credentials = useCredentialsByType(credentialType, open);
  const form = useForm<WebhookMessageFormValues>({
    resolver: zodResolver(webhookMessageFormSchema(nodeType)),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      credentialId: defaultValues?.credentialId ?? "",
      content: defaultValues?.content ?? "",
      username: defaultValues?.username ?? "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      variableName: defaultValues?.variableName ?? "",
      credentialId:
        defaultValues?.credentialId || credentials.data?.[0]?.id || "",
      content: defaultValues?.content ?? "",
      username: defaultValues?.username ?? "",
    });
  }, [credentials.data, defaultValues, form, open]);

  const handleSubmit = (values: WebhookMessageFormValues) => {
    onSubmit({
      variableName: values.variableName,
      credentialId: values.credentialId,
      content: values.content,
      ...(config.hasUsername ? { username: values.username } : {}),
    });
    onOpenChange(false);
  };

  const variableName = form.watch("variableName") || "messageResult";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{config.name}</DialogTitle>
            <DialogDescription>
              Send a templated message through a saved {config.name} webhook.
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
                      <Input placeholder="messageResult" {...field} />
                    </FormControl>
                    <FormDescription>
                      Reference the sent message later as{" "}
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
                                  : "Select a webhook credential"
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
                      <span className="block">
                        Reuse a saved webhook instead of pasting the URL on
                        every node.
                      </span>
                      <span className="mt-2 block space-y-1">
                        {config.setupSteps.map((step) => (
                          <span key={step} className="block">
                            {step}
                          </span>
                        ))}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summary {{previousRequest.httpResponse.data}}"
                        className="min-h-28 resize-y font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Supports {"{{variables}}"} and {"{{json variable}}"}.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {config.hasUsername && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot username</FormLabel>
                      <FormControl>
                        <Input placeholder="M9M" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional. Overrides the webhook&apos;s default name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
        type={credentialType}
        onCreated={(credential) => {
          form.setValue("credentialId", credential.id, {
            shouldValidate: true,
          });
        }}
      />
    </>
  );
};
