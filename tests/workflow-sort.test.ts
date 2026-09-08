import assert from "node:assert/strict";
import test from "node:test";
import { reachableFrom, topologicalSort } from "../src/inngest/utils";

const node = (id: string) => ({ id });
const conn = (fromNodeId: string, toNodeId: string) => ({ fromNodeId, toNodeId });

test("runs the trigger before connected actions", () => {
  const sorted = topologicalSort(
    [node("http"), node("manual")],
    [conn("manual", "http")],
  );
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["manual", "http"],
  );
});

test("does not treat a disconnected node as a cycle", () => {
  const sorted = topologicalSort(
    [node("manual"), node("http"), node("form")],
    [conn("manual", "http")],
  );
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["manual", "http", "form"],
  );
});

test("reachableFrom only follows connected nodes from the trigger", () => {
  const { nodes, connections } = reachableFrom(
    ["manual"],
    [node("manual"), node("http"), node("form")],
    [conn("manual", "http")],
  );
  assert.deepEqual(nodes.map((item) => item.id).sort(), ["http", "manual"]);
  assert.equal(connections.length, 1);
});
