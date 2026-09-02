"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  CREDENTIAL_CONFIG,
  CREDENTIAL_TYPES,
} from "@/features/credentials/config";
import {
  credentialNameSchema,
  credentialValueSchema,
} from "@/features/credentials/schema";
import type { PublicCredential } from "@/features/credentials/types";
import type { CredentialType } from "@/generated/prisma/enums";
import {
  useCreateCredential,
  useUpdateCredential,
} from "../hooks/use-credentials";

const createFormSchema = z.object({
  name: credentialNameSchema,
  type: z.enum(CREDENTIAL_TYPES),
  value: credentialValueSchema,
});

const updateFormSchema = z.object({
  name: credentialNameSchema,
  type: z.enum(CREDENTIAL_TYPES),
  value: z.union([credentialValueSchema, z.literal("")]),
});

type CredentialFormValues = z.infer<typeof updateFormSchema>;

interface CredentialFormProps {
  initialData?: PublicCredential;
  defaultType?: CredentialType;
  compact?: boolean;
  onSuccess?: (credential: PublicCredential) => void;
  onCancel?: () => void;
}

export const CredentialForm = ({
  initialData,
  defaultType,
  compact = false,
  onSuccess,
  onCancel,
}: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const isEditing = Boolean(initialData);
  const isPending = createCredential.isPending || updateCredential.isPending;
  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? defaultType ?? CREDENTIAL_TYPES[0],
      value: "",
    },
  });
  const selectedType = form.watch("type");
  const selectedConfig = CREDENTIAL_CONFIG[selectedType];

  const handleSuccess = (credential: PublicCredential) => {
    onSuccess?.(credential);
    if (!compact) {
      router.push("/credentials");
    }
  };

  const handleSubmit = (values: CredentialFormValues) => {
    if (initialData) {
      updateCredential.mutate(
        {
          id: initialData.id,
          name: values.name,
          value: values.value,
        },
        { onSuccess: handleSuccess },
      );
      return;
    }

    createCredential.mutate(values, { onSuccess: handleSuccess });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Production key" {...field} />
              </FormControl>
              <FormDescription>
                Use a name that identifies where this credential is used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isEditing || Boolean(defaultType)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CREDENTIAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CREDENTIAL_CONFIG[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{selectedConfig.description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? "Replace secret value" : "Secret value"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={
                    isEditing
                      ? "Leave blank to keep the current value"
                      : selectedConfig.placeholder
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Secret values are write-only and are never returned by the
                credentials API.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ?? (() => router.push("/credentials"))}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isEditing ? "Save changes" : "Create credential"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
