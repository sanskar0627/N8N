import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemplate } from "../src/features/executions/lib/template";
import { googleFormWebhookPayloadSchema } from "../src/features/triggers/components/google-form-trigger/schema";
import { generateGoogleFormScript } from "../src/features/triggers/components/google-form-trigger/script";
import {
  buildGoogleFormInitialData,
  getGoogleFormEventId,
  safeCompareSecrets,
} from "../src/features/triggers/components/google-form-trigger/utils";
import { googleFormTriggerChannelName } from "../src/inngest/channels/google-form-trigger";

const validPayload = {
  formId: "form-123",
  formTitle: "Contact form",
  responseId: "response-123",
  timestamp: "2026-08-30T10:00:00.000Z",
  respondentEmail: "person@example.com",
  responses: {
    Name: "Ada",
    Interests: ["Automation", "APIs"],
  },
};

test("validates and normalizes Google Form submissions", () => {
  const result = googleFormWebhookPayloadSchema.parse(validPayload);

  assert.equal(result.timestamp, "2026-08-30T10:00:00.000Z");
  assert.deepEqual(buildGoogleFormInitialData(result), {
    googleForm: {
      ...result,
      raw: result,
    },
  });
});

test("rejects malformed Google Form submissions", () => {
  assert.equal(
    googleFormWebhookPayloadSchema.safeParse({
      ...validPayload,
      formId: "",
    }).success,
    false,
  );
  assert.equal(
    googleFormWebhookPayloadSchema.safeParse({
      ...validPayload,
      responses: "not-an-object",
    }).success,
    false,
  );
});

test("compares secrets and creates stable submission event ids", () => {
  assert.equal(safeCompareSecrets("same-secret", "same-secret"), true);
  assert.equal(safeCompareSecrets("wrong", "same-secret"), false);
  assert.equal(
    getGoogleFormEventId("workflow-1", "response-1"),
    getGoogleFormEventId("workflow-1", "response-1"),
  );
  assert.notEqual(
    getGoogleFormEventId("workflow-1", "response-1"),
    getGoogleFormEventId("workflow-1", "response-2"),
  );
});

test("generates a secure retrying Apps Script", () => {
  const script = generateGoogleFormScript(
    "https://m9m.example/api/webhooks/google-form?workflowId=one&nodeId=two",
    'secret"\nvalue',
  );

  assert.match(script, /function onFormSubmit/);
  assert.match(script, /"X-Secret": "secret\\"\\nvalue"/);
  assert.match(script, /attempt < 3/);
  assert.match(script, /duplicateCounts/);
});

test("supports question titles and workflow-scoped realtime", () => {
  const context = buildGoogleFormInitialData(
    googleFormWebhookPayloadSchema.parse(validPayload),
  );

  assert.equal(
    resolveTemplate(
      '{{lookup googleForm.responses "Name"}}',
      context,
      "message",
    ),
    "Ada",
  );
  assert.equal(
    googleFormTriggerChannelName("workflow-1"),
    "workflow:workflow-1:google-form-trigger-execution",
  );
});
