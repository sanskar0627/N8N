import assert from "node:assert/strict";
import test from "node:test";
import { getLatestNodeStatus } from "../src/features/executions/lib/realtime-status";
import { httpRequestChannelName } from "../src/inngest/channels/http-request";
import { manualTriggerChannelName } from "../src/inngest/channels/manual-trigger";

test("scopes realtime channels to a workflow", () => {
  assert.equal(
    httpRequestChannelName("workflow-a"),
    "workflow:workflow-a:http-request-execution",
  );
  assert.equal(
    manualTriggerChannelName("workflow-b"),
    "workflow:workflow-b:manual-trigger-execution",
  );
  assert.notEqual(
    httpRequestChannelName("workflow-a"),
    httpRequestChannelName("workflow-b"),
  );
});

test("selects the latest matching node status", () => {
  const messages = [
    {
      kind: "data",
      channel: "workflow:one:http-request-execution",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:00Z"),
      data: { nodeId: "node-one", status: "loading" },
    },
    {
      kind: "data",
      channel: "workflow:one:http-request-execution",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:02Z"),
      data: { nodeId: "node-one", status: "success" },
    },
    {
      kind: "data",
      channel: "workflow:one:http-request-execution",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:03Z"),
      data: { nodeId: "another-node", status: "error" },
    },
  ];

  assert.equal(
    getLatestNodeStatus(messages, {
      nodeId: "node-one",
      channel: "workflow:one:http-request-execution",
      topic: "status",
    }),
    "success",
  );
});

test("ignores malformed and unrelated realtime messages", () => {
  assert.equal(
    getLatestNodeStatus(
      [
        null,
        { kind: "ping" },
        {
          kind: "data",
          channel: "workflow:two:http-request-execution",
          topic: "status",
          createdAt: new Date(),
          data: { nodeId: "node-one", status: "unknown" },
        },
      ],
      {
        nodeId: "node-one",
        channel: "workflow:one:http-request-execution",
        topic: "status",
      },
    ),
    undefined,
  );
});
