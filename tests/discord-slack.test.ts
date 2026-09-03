import assert from "node:assert/strict";
import test from "node:test";
import { getCredentialTypeForNode } from "../src/features/credentials/config";
import {
  collectNodeCredentialRefs,
  findInvalidNodeCredentialRef,
} from "../src/features/credentials/lib/ai-credentials";
import { hydrateNodeData } from "../src/features/credentials/lib/hydrate-ai-node-data";
import { isAllowedWebhookUrl } from "../src/features/credentials/lib/webhook-url";
import { createCredentialSchema } from "../src/features/credentials/schema";
import {
  isWebhookMessageNodeType,
  WEBHOOK_MESSAGE_CONFIG,
  WEBHOOK_MESSAGE_NODE_TYPES,
} from "../src/features/executions/components/webhook-message/config";
import { webhookMessageFormSchema } from "../src/features/executions/components/webhook-message/schema";
import { CredentialType, NodeType } from "../src/generated/prisma/enums";

test("maps Discord and Slack nodes to webhook credentials", () => {
  assert.deepEqual(WEBHOOK_MESSAGE_NODE_TYPES, [
    NodeType.DISCORD,
    NodeType.SLACK,
  ]);
  assert.equal(
    getCredentialTypeForNode(NodeType.DISCORD),
    CredentialType.DISCORD,
  );
  assert.equal(getCredentialTypeForNode(NodeType.SLACK), CredentialType.SLACK);
  assert.equal(isWebhookMessageNodeType(NodeType.DISCORD), true);
  assert.equal(isWebhookMessageNodeType(NodeType.HTTP_REQUEST), false);
});

test("accepts only provider webhook URLs", () => {
  assert.equal(
    isAllowedWebhookUrl(
      "https://discord.com/api/webhooks/123/abc",
      CredentialType.DISCORD,
    ),
    true,
  );
  assert.equal(
    isAllowedWebhookUrl(
      "https://discordapp.com/api/webhooks/123/abc",
      CredentialType.DISCORD,
    ),
    true,
  );
  assert.equal(
    isAllowedWebhookUrl(
      "https://evil.example/api/webhooks/123/abc",
      CredentialType.DISCORD,
    ),
    false,
  );
  assert.equal(
    isAllowedWebhookUrl(
      "https://hooks.slack.com/services/T1/B1/abc",
      CredentialType.SLACK,
    ),
    true,
  );
  assert.equal(
    isAllowedWebhookUrl(
      "https://hooks.slack.com/triggers/T1/123/abc",
      CredentialType.SLACK,
    ),
    true,
  );
  assert.equal(
    isAllowedWebhookUrl(
      "http://hooks.slack.com/services/T1/B1/abc",
      CredentialType.SLACK,
    ),
    false,
  );
});

test("validates Discord and Slack credential payloads", () => {
  assert.equal(
    createCredentialSchema.safeParse({
      name: "Alerts",
      type: CredentialType.DISCORD,
      value: "https://discord.com/api/webhooks/123/abc",
    }).success,
    true,
  );
  assert.equal(
    createCredentialSchema.safeParse({
      name: "Alerts",
      type: CredentialType.SLACK,
      value: "https://example.com/hooks/slack",
    }).success,
    false,
  );
});

test("requires a credential and message content on webhook nodes", () => {
  const discord = webhookMessageFormSchema(NodeType.DISCORD).parse({
    variableName: "discordResult",
    credentialId: "cred_discord",
    content: "Hello {{user.name}}",
    username: "M9M",
  });
  assert.equal(discord.credentialId, "cred_discord");
  assert.equal(
    webhookMessageFormSchema(NodeType.SLACK).safeParse({
      variableName: "slackResult",
      content: "Hello",
    }).success,
    false,
  );
  assert.equal(WEBHOOK_MESSAGE_CONFIG.DISCORD.hasUsername, true);
  assert.equal(WEBHOOK_MESSAGE_CONFIG.SLACK.hasUsername, false);
});

test("collects Discord and Slack credential references", () => {
  const refs = collectNodeCredentialRefs([
    { type: NodeType.DISCORD, data: { credentialId: "cred_discord" } },
    { type: NodeType.SLACK, data: { credentialId: "cred_slack" } },
    { type: NodeType.OPENAI, data: { credentialId: "cred_openai" } },
  ]);

  assert.deepEqual(
    refs.map((ref) => ref.nodeType),
    [NodeType.DISCORD, NodeType.SLACK, NodeType.OPENAI],
  );
  assert.equal(
    findInvalidNodeCredentialRef(refs, [
      { id: "cred_discord", type: CredentialType.DISCORD },
      { id: "cred_slack", type: CredentialType.ANTHROPIC },
      { id: "cred_openai", type: CredentialType.OPENROUTER },
    ]),
    "Credential type does not match this node",
  );
});

test("hydrates webhook URLs from saved credentials", async () => {
  const hydrated = await hydrateNodeData(
    {
      nodeType: NodeType.SLACK,
      userId: "user_1",
      data: {
        credentialId: "cred_slack",
        content: "Hello",
      },
    },
    async ({ type }) => {
      assert.equal(type, CredentialType.SLACK);
      return { value: "https://hooks.slack.com/services/T1/B1/abc" };
    },
  );

  assert.equal(
    hydrated.webhookUrl,
    "https://hooks.slack.com/services/T1/B1/abc",
  );
});

test("rejects an unsafe webhook credential during hydration", async () => {
  await assert.rejects(
    () =>
      hydrateNodeData(
        {
          nodeType: NodeType.DISCORD,
          userId: "user_1",
          data: { credentialId: "cred_bad" },
        },
        async () => ({ value: "https://evil.example/hook" }),
      ),
    /Credential webhook URL is invalid/,
  );
});
