import assert from "node:assert/strict";
import test from "node:test";
import { resolveTemplate } from "../src/features/executions/lib/template";
import {
  buildContextFromVariables,
  extractTemplateVariables,
} from "../src/features/executions/lib/template-variables";

test("resolves nested values without html escaping", () => {
  const result = resolveTemplate(
    "https://example.com/search?q={{request.query}}",
    { request: { query: "cats&dogs" } },
    "endpoint",
  );

  assert.equal(result, "https://example.com/search?q=cats&dogs");
});

test("serializes objects with the json helper", () => {
  const result = resolveTemplate(
    '{\n  "payload": {{json request.body}}\n}',
    { request: { body: { label: 'Tom "Boss"', active: true } } },
    "request body",
  );

  assert.deepEqual(JSON.parse(result), {
    payload: { label: 'Tom "Boss"', active: true },
  });
});

test("reports the field containing an invalid template", () => {
  assert.throws(
    () => resolveTemplate("{{unclosed", {}, "request body"),
    /Invalid template in request body/,
  );
});

test("extracts context paths and ignores helper names", () => {
  const variables = extractTemplateVariables({
    endpoint: "https://example.com/{{request.id}}",
    body: [
      "{{json request.payload}}",
      '{{lookup form.responses "Question Name"}}',
      "{{#if flags.enabled}}{{profile.name}}{{/if}}",
    ],
  });

  assert.deepEqual(variables, [
    "flags.enabled",
    "form.responses",
    "profile.name",
    "request.id",
    "request.payload",
  ]);
});

test("builds typed nested mock context safely", () => {
  const context = buildContextFromVariables({
    "request.id": "42",
    "request.payload": '{"active":true}',
    "__proto__.polluted": "true",
  });

  assert.deepEqual(context, {
    request: {
      id: 42,
      payload: { active: true },
    },
  });
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});
