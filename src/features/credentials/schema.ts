import { z } from "zod";
import { CREDENTIAL_TYPES } from "./config";
import {
  isAllowedWebhookUrl,
  isWebhookCredentialType,
} from "./lib/webhook-url";

export const credentialNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const credentialValueSchema = z
  .string()
  .trim()
  .min(8, "Credential value is too short")
  .max(2_000, "Credential value is too long");

export const refineCredentialValue = (
  data: { type: string; value?: string },
  ctx: z.RefinementCtx,
) => {
  if (!data.value || !isWebhookCredentialType(data.type)) {
    return;
  }

  if (!isAllowedWebhookUrl(data.value, data.type)) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message:
        data.type === "DISCORD"
          ? "Enter a valid Discord webhook URL"
          : "Enter a valid Slack webhook URL",
    });
  }
};

export const createCredentialSchema = z
  .object({
    name: credentialNameSchema,
    type: z.enum(CREDENTIAL_TYPES),
    value: credentialValueSchema,
  })
  .superRefine(refineCredentialValue);

export const updateCredentialSchema = z.object({
  id: z.string(),
  name: credentialNameSchema,
  value: z.union([credentialValueSchema, z.literal("")]).optional(),
});

export const credentialFormSchema = z
  .object({
    name: credentialNameSchema,
    type: z.enum(CREDENTIAL_TYPES),
    value: credentialValueSchema,
  })
  .superRefine(refineCredentialValue);

export const credentialUpdateFormSchema = z
  .object({
    name: credentialNameSchema,
    type: z.enum(CREDENTIAL_TYPES),
    value: z.union([credentialValueSchema, z.literal("")]),
  })
  .superRefine((data, ctx) => {
    if (!data.value) {
      return;
    }
    refineCredentialValue(data, ctx);
  });

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
