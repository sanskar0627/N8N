import assert from "node:assert/strict";
import test from "node:test";
import { getLatestNodeStatus } from "../src/features/executions/lib/realtime-status";
import { workflowNodeStatusChannelName } from "../src/inngest/channels/workflow-node-status";

test("scopes realtime channels to a workflow", () => {
  assert.equal(
    workflowNodeStatusChannelName("workflow-a"),
    "workflow:workflow-a:node-status",
  );
  assert.equal(
    workflowNodeStatusChannelName("workflow-b"),
    "workflow:workflow-b:node-status",
  );
  assert.notEqual(
    workflowNodeStatusChannelName("workflow-a"),
    workflowNodeStatusChannelName("workflow-b"),
  );
});

test("selects the latest matching node status", () => {
  const messages = [
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:00Z"),
      data: { nodeId: "node-one", status: "loading" },
    },
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:02Z"),
      data: { nodeId: "node-one", status: "success" },
    },
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:03Z"),
      data: { nodeId: "another-node", status: "error" },
    },
  ];

  assert.equal(
    getLatestNodeStatus(messages, {
      nodeId: "node-one",
      channel: "workflow:one:node-status",
      topic: "status",
    }),
    "success",
  );
});

test("ignores statuses from an older overlapping execution", () => {
  const messages = [
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:00Z"),
      data: { nodeId: "node-one", status: "success", executionId: "run-a" },
    },
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:05Z"),
      data: { nodeId: "node-one", status: "loading", executionId: "run-b" },
    },
    {
      kind: "data",
      channel: "workflow:one:node-status",
      topic: "status",
      createdAt: new Date("2026-08-29T10:00:06Z"),
      data: { nodeId: "node-one", status: "success", executionId: "run-a" },
    },
  ];

  assert.equal(
    getLatestNodeStatus(messages, {
      nodeId: "node-one",
      channel: "workflow:one:node-status",
      topic: "status",
    }),
    "loading",
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
          channel: "workflow:two:node-status",
          topic: "status",
          createdAt: new Date(),
          data: { nodeId: "node-one", status: "unknown" },
        },
      ],
      {
        nodeId: "node-one",
        channel: "workflow:one:node-status",
        topic: "status",
      },
    ),
    undefined,
  );
});
