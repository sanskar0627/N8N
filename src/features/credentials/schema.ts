import { z } from "zod";
import { CREDENTIAL_TYPES } from "./config";

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

export const createCredentialSchema = z.object({
  name: credentialNameSchema,
  type: z.enum(CREDENTIAL_TYPES),
  value: credentialValueSchema,
});

export const updateCredentialSchema = z.object({
  id: z.string(),
  name: credentialNameSchema,
  value: z.union([credentialValueSchema, z.literal("")]).optional(),
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
