import { z } from "zod";
import { variableNameSchema } from "@/features/executions/lib/variable-name";
import type { WebhookMessageNodeType } from "./config";
import { WEBHOOK_MESSAGE_CONFIG } from "./config";

export const webhookMessageFormSchema = (nodeType: WebhookMessageNodeType) => {
  const config = WEBHOOK_MESSAGE_CONFIG[nodeType];

  return z.object({
    variableName: variableNameSchema,
    credentialId: z.string().min(1, "Credential is required"),
    content: z
      .string()
      .trim()
      .min(1, "Message content is required")
      .max(
        config.contentMax,
        `Message cannot exceed ${config.contentMax} characters`,
      ),
    username: z.string().trim().max(80).optional(),
  });
};

export type WebhookMessageFormValues = {
  variableName: string;
  credentialId: string;
  content: string;
  username?: string;
};

export type WebhookMessageData = WebhookMessageFormValues;
