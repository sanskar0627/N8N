import { z } from "zod";

export const stripeWebhookSecretSchema = z
  .string()
  .trim()
  .min(16, "Enter a valid Stripe webhook signing secret")
  .max(512, "Webhook signing secret is too long")
  .startsWith("whsec_", "Webhook signing secret must start with whsec_");

export const stripeEventTypesSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(100)
  .transform((eventTypes) => [...new Set(eventTypes)].sort());

export const stripeWebhookConfigSchema = z.object({
  webhookSecret: stripeWebhookSecretSchema.optional(),
  allowedEventTypes: stripeEventTypesSchema.default([]),
});

export type StripeWebhookConfig = z.infer<typeof stripeWebhookConfigSchema>;
