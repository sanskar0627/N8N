import assert from "node:assert/strict";
import test from "node:test";
import {
  formatExecutionDuration,
  formatExecutionStatus,
} from "../src/features/executions/lib/format-execution";
import { redactExecutionOutput } from "../src/features/executions/lib/redact-execution-output";
import { ExecutionStatus } from "../src/generated/prisma/enums";

test("formats execution statuses for the history UI", () => {
  assert.equal(formatExecutionStatus(ExecutionStatus.RUNNING), "Running");
  assert.equal(formatExecutionStatus(ExecutionStatus.SUCCESS), "Success");
  assert.equal(formatExecutionStatus(ExecutionStatus.FAILED), "Failed");
});

test("formats execution durations", () => {
  const startedAt = new Date("2026-09-04T10:00:00.000Z");

  assert.equal(formatExecutionDuration(startedAt, null), null);
  assert.equal(
    formatExecutionDuration(startedAt, new Date("2026-09-04T10:00:00.240Z")),
    "240ms",
  );
  assert.equal(
    formatExecutionDuration(startedAt, new Date("2026-09-04T10:00:04.200Z")),
    "4.2s",
  );
  assert.equal(
    formatExecutionDuration(startedAt, new Date("2026-09-04T10:01:05.000Z")),
    "1m 5s",
  );
});

test("redacts secrets from execution output", () => {
  assert.deepEqual(
    redactExecutionOutput({
      summary: {
        text: "ok",
        apiKey: "sk-secret",
        webhookUrl: "https://hooks.slack.com/services/T1/B1/abc",
      },
      nested: [{ token: "abc", value: 1 }],
    }),
    {
      summary: {
        text: "ok",
        apiKey: "[redacted]",
        webhookUrl: "[redacted]",
      },
      nested: [{ token: "[redacted]", value: 1 }],
    },
  );
});

test("ignores prototype pollution keys while redacting output", () => {
  const output = redactExecutionOutput({
    safe: true,
    constructor: { polluted: true },
  }) as Record<string, unknown>;

  assert.equal(output.safe, true);
  assert.equal(Object.hasOwn(output, "constructor"), false);
});
