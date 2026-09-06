import { createHash, timingSafeEqual } from "node:crypto";
import type { GoogleFormWebhookPayload } from "./schema";

export const safeCompareSecrets = (provided: string, expected: string) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export const buildGoogleFormInitialData = (
  payload: GoogleFormWebhookPayload,
) => ({
  googleForm: {
    ...payload,
    raw: payload,
  },
});

export const getGoogleFormEventId = (
  workflowId: string,
  responseId: string,
) => {
  const digest = createHash("sha256")
    .update(`${workflowId}:${responseId}`)
    .digest("hex");
  return `google-form-${digest}`;
};
