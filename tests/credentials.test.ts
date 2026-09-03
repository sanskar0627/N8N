import assert from "node:assert/strict";
import test from "node:test";
import { getCredentialTypeForAiNode } from "../src/features/credentials/config";
import {
  collectAiCredentialRefs,
  findInvalidAiCredentialRef,
} from "../src/features/credentials/lib/ai-credentials";
import {
  readCredentialValue,
  storeCredentialValue,
} from "../src/features/credentials/lib/credential-value";
import { hydrateAiNodeData } from "../src/features/credentials/lib/hydrate-ai-node-data";
import {
  createCredentialSchema,
  updateCredentialSchema,
} from "../src/features/credentials/schema";
import { CredentialType, NodeType } from "../src/generated/prisma/enums";

test("maps each AI node to the matching reusable credential type", () => {
  assert.equal(
    getCredentialTypeForAiNode(NodeType.OPENAI),
    CredentialType.OPENROUTER,
  );
  assert.equal(
    getCredentialTypeForAiNode(NodeType.ANTHROPIC),
    CredentialType.ANTHROPIC,
  );
  assert.equal(
    getCredentialTypeForAiNode(NodeType.GEMINI),
    CredentialType.GEMINI,
  );
});

test("validates credential create and update payloads", () => {
  assert.equal(
    createCredentialSchema.safeParse({
      name: "Production OpenRouter",
      type: CredentialType.OPENROUTER,
      value: "sk-or-v1-testkey",
    }).success,
    true,
  );
  assert.equal(
    createCredentialSchema.safeParse({
      name: "x",
      type: CredentialType.OPENROUTER,
      value: "short",
    }).success,
    false,
  );
  assert.equal(
    updateCredentialSchema.safeParse({
      id: "cred_1",
      name: "Renamed key",
      value: "",
    }).success,
    true,
  );
});

test("keeps credential values write-through until encryption is added", () => {
  assert.equal(storeCredentialValue("sk-ant-secret"), "sk-ant-secret");
  assert.equal(readCredentialValue("sk-ant-secret"), "sk-ant-secret");
});

test("collects only AI node credential references", () => {
  assert.deepEqual(
    collectAiCredentialRefs([
      { type: NodeType.HTTP_REQUEST, data: { credentialId: "ignored" } },
      { type: NodeType.OPENAI, data: { credentialId: "cred_openai" } },
      { type: NodeType.GEMINI, data: { credentialId: "" } },
      { type: NodeType.ANTHROPIC, data: { credentialId: "cred_claude" } },
    ]),
    [
      { nodeType: NodeType.OPENAI, credentialId: "cred_openai" },
      { nodeType: NodeType.ANTHROPIC, credentialId: "cred_claude" },
    ],
  );
});

test("rejects missing or mismatched credentials on AI nodes", () => {
  const refs = collectAiCredentialRefs([
    { type: NodeType.OPENAI, data: { credentialId: "cred_openai" } },
  ]);

  assert.equal(
    findInvalidAiCredentialRef(refs, [
      { id: "cred_openai", type: CredentialType.ANTHROPIC },
    ]),
    "Credential type does not match this node",
  );
  assert.equal(
    findInvalidAiCredentialRef(refs, []),
    "Selected credential was not found",
  );
  assert.equal(
    findInvalidAiCredentialRef(refs, [
      { id: "cred_openai", type: CredentialType.OPENROUTER },
    ]),
    null,
  );
});

test("hydrates AI node data from a saved credential", async () => {
  const hydrated = await hydrateAiNodeData(
    {
      nodeType: NodeType.OPENAI,
      userId: "user_1",
      data: {
        credentialId: "cred_openai",
        model: "openai/gpt-4o-mini",
      },
    },
    async ({ id, userId, type }) => {
      assert.equal(id, "cred_openai");
      assert.equal(userId, "user_1");
      assert.equal(type, CredentialType.OPENROUTER);
      return { value: "sk-or-v1-hydrated" };
    },
  );

  assert.equal(hydrated.apiKey, "sk-or-v1-hydrated");
});

test("keeps an existing inline api key and skips credential lookup", async () => {
  const hydrated = await hydrateAiNodeData(
    {
      nodeType: NodeType.ANTHROPIC,
      userId: "user_1",
      data: {
        apiKey: "sk-ant-inline",
        credentialId: "cred_unused",
      },
    },
    async () => {
      throw new Error("lookup should not run");
    },
  );

  assert.equal(hydrated.apiKey, "sk-ant-inline");
});

test("fails closed when a selected credential is missing", async () => {
  await assert.rejects(
    () =>
      hydrateAiNodeData(
        {
          nodeType: NodeType.GEMINI,
          userId: "user_1",
          data: { credentialId: "missing" },
        },
        async () => null,
      ),
    /Credential not found or incompatible with this node/,
  );
});
