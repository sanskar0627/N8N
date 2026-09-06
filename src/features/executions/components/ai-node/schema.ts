import { z } from "zod";
import { variableNameSchema } from "@/features/executions/lib/variable-name";

export const aiNodeFormSchema = z.object({
  variableName: variableNameSchema,
  credentialId: z.string().min(1, "Credential is required"),
  model: z.string().trim().min(1, "Model is required").max(300),
  systemPrompt: z.string().max(50_000).optional(),
  userPrompt: z
    .string()
    .min(1, "User prompt is required")
    .max(100_000, "User prompt is too long"),
});

export type AiNodeFormValues = z.infer<typeof aiNodeFormSchema>;

export type AiNodeData = AiNodeFormValues;
