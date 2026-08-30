import { z } from "zod";

const answerSchema = z.union([
  z.string().max(10_000),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string().max(10_000)).max(100),
]);

export const googleFormWebhookPayloadSchema = z
  .object({
    formId: z.string().min(1).max(256),
    formTitle: z.string().max(500),
    responseId: z.string().min(1).max(512),
    timestamp: z.union([z.string(), z.number()]).transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: "custom",
          message: "Timestamp must be a valid date",
        });
        return z.NEVER;
      }
      return date.toISOString();
    }),
    respondentEmail: z
      .string()
      .max(320)
      .nullish()
      .transform((value) => value ?? ""),
    responses: z
      .record(z.string().min(1).max(500), answerSchema)
      .refine((responses) => Object.keys(responses).length <= 500, {
        message: "A maximum of 500 responses is allowed",
      }),
  })
  .strict();

export type GoogleFormWebhookPayload = z.infer<
  typeof googleFormWebhookPayloadSchema
>;
