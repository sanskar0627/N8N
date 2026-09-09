import assert from "node:assert/strict";
import test from "node:test";
import { getGeneratedText } from "../src/features/executions/lib/generated-text";
import {
  MAX_HTTP_RESPONSE_BYTES,
  readLimitedResponseBody,
} from "../src/features/executions/lib/limited-response";
import { createPinnedLookup } from "../src/features/executions/lib/pinned-fetch";
import {
  assertSafeHttpUrl,
  isBlockedHostname,
  isBlockedIpAddress,
  sanitizeHttpHeaders,
} from "../src/features/executions/lib/safe-http-url";
import { buildSlackWebhookPayload } from "../src/features/executions/lib/slack-payload";
import { nodeStepId } from "../src/features/executions/lib/step-id";

test("blocks private, link-local, and loopback addresses", () => {
  assert.equal(isBlockedIpAddress("127.0.0.1"), true);
  assert.equal(isBlockedIpAddress("10.1.2.3"), true);
  assert.equal(isBlockedIpAddress("172.16.0.4"), true);
  assert.equal(isBlockedIpAddress("192.168.1.10"), true);
  assert.equal(isBlockedIpAddress("169.254.169.254"), true);
  assert.equal(isBlockedIpAddress("100.64.1.2"), true);
  assert.equal(isBlockedIpAddress("::1"), true);
  assert.equal(isBlockedIpAddress("::ffff:127.0.0.1"), true);
  assert.equal(isBlockedIpAddress("8.8.8.8"), false);
});

test("blocks localhost-style hostnames before DNS", () => {
  assert.equal(isBlockedHostname("localhost"), true);
  assert.equal(isBlockedHostname("foo.localhost"), true);
  assert.equal(isBlockedHostname("metadata.google.internal"), true);
  assert.equal(isBlockedHostname("service.local"), true);
  assert.equal(isBlockedHostname("api.example.com"), false);
});

test("rejects unsafe HTTP endpoints", async () => {
  await assert.rejects(
    () => assertSafeHttpUrl("file:///etc/passwd"),
    /must use HTTP or HTTPS/,
  );
  await assert.rejects(
    () => assertSafeHttpUrl("http://127.0.0.1/admin"),
    /host is not allowed/,
  );
  await assert.rejects(
    () => assertSafeHttpUrl("http://localhost/health"),
    /host is not allowed/,
  );
  await assert.rejects(
    () => assertSafeHttpUrl("https://user:pass@example.com"),
    /must not include credentials/,
  );
});

test("strips hop-by-hop headers and CRLF values", () => {
  assert.deepEqual(
    sanitizeHttpHeaders({
      Authorization: "Bearer token",
      Host: "internal.local",
      "X-Request-Id": "ok",
      "X-Injected": "one\r\nX-Evil: two",
    }),
    {
      Authorization: "Bearer token",
      "X-Request-Id": "ok",
    },
  );
});

test("reads empty and JSON bodies, and rejects oversized payloads", async () => {
  assert.equal(
    await readLimitedResponseBody(new Response(null, { status: 204 })),
    null,
  );
  assert.deepEqual(
    await readLimitedResponseBody(
      new Response('{"ok":true}', {
        headers: { "Content-Type": "application/json" },
      }),
    ),
    { ok: true },
  );
  await assert.rejects(
    () =>
      readLimitedResponseBody(
        new Response("x", {
          headers: { "Content-Length": String(MAX_HTTP_RESPONSE_BYTES + 1) },
        }),
      ),
    /too large/,
  );
});

test("keeps Slack incoming webhooks and workflow webhooks compatible", () => {
  assert.deepEqual(buildSlackWebhookPayload("Hello"), {
    text: "Hello",
    content: "Hello",
  });
});

test("pins later DNS lookups to the already-checked addresses", () => {
  const lookup = createPinnedLookup([{ address: "203.0.113.10", family: 4 }]);

  lookup("evil.example", { all: true }, (error, addresses) => {
    assert.equal(error, null);
    assert.deepEqual(addresses, [{ address: "203.0.113.10", family: 4 }]);
  });
  lookup("evil.example", {}, (error, address, family) => {
    assert.equal(error, null);
    assert.equal(address, "203.0.113.10");
    assert.equal(family, 4);
  });
});

test("scopes Inngest step ids to each node", () => {
  assert.equal(nodeStepId("http-request", "node_a"), "http-request:node_a");
  assert.notEqual(
    nodeStepId("http-request", "node_a"),
    nodeStepId("http-request", "node_b"),
  );
});

test("reads the aggregated AI SDK text field", () => {
  assert.equal(
    getGeneratedText({
      text: "final answer",
      steps: [{ content: [{ type: "reasoning", text: "thinking" }] }],
    } as { text?: unknown }),
    "final answer",
  );
  assert.equal(getGeneratedText({}), "");
});
