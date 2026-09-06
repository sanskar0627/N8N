import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_NODE_CONFIG,
  AI_NODE_TYPES,
  isAiNodeType,
} from "../src/features/executions/components/ai-node/config";
import { aiNodeFormSchema } from "../src/features/executions/components/ai-node/schema";
import { extractTemplateVariables } from "../src/features/executions/lib/template-variables";
import { NodeType } from "../src/generated/prisma/enums";
import { workflowNodeStatusChannelName } from "../src/inngest/channels/workflow-node-status";

test("defines the executor-compatible AI provider contracts", () => {
  assert.deepEqual(AI_NODE_TYPES, [
    NodeType.OPENAI,
    NodeType.ANTHROPIC,
    NodeType.GEMINI,
  ]);
  assert.equal(AI_NODE_CONFIG.OPENAI.defaultModel, "openai/gpt-4o-mini");
  assert.equal(AI_NODE_CONFIG.OPENAI.outputField, "openAIResponse");
  assert.equal(
    AI_NODE_CONFIG.ANTHROPIC.defaultModel,
    "claude-sonnet-4-20250514",
  );
  assert.equal(AI_NODE_CONFIG.ANTHROPIC.outputField, "anthropicResponse");
  assert.equal(AI_NODE_CONFIG.GEMINI.defaultModel, "gemini-2.0-flash");
  assert.equal(AI_NODE_CONFIG.GEMINI.outputField, "geminiResponse");
});

test("requires a saved credential for AI nodes", () => {
  const result = aiNodeFormSchema.parse({
    variableName: "summary",
    credentialId: "cred_123",
    model: "provider/model",
    systemPrompt: "Use {{customer.preferences}}",
    userPrompt: "Summarize {{json order.items}}",
  });

  assert.equal(result.credentialId, "cred_123");
  assert.equal(
    aiNodeFormSchema.safeParse({
      variableName: "summary",
      model: "provider/model",
      userPrompt: "Summarize this",
    }).success,
    false,
  );
});

test("discovers workflow variables in AI prompts", () => {
  assert.deepEqual(
    extractTemplateVariables({
      systemPrompt: "Use {{customer.preferences}}",
      userPrompt: "Summarize {{json order.items}} for {{customer.name}}",
    }),
    ["customer.name", "customer.preferences", "order.items"],
  );
});

test("identifies only supported AI node types", () => {
  assert.equal(isAiNodeType(NodeType.OPENAI), true);
  assert.equal(isAiNodeType(NodeType.ANTHROPIC), true);
  assert.equal(isAiNodeType(NodeType.GEMINI), true);
  assert.equal(isAiNodeType(NodeType.HTTP_REQUEST), false);
});

test("scopes shared AI status streams to each workflow", () => {
  assert.equal(
    workflowNodeStatusChannelName("workflow-1"),
    "workflow:workflow-1:node-status",
  );
  assert.notEqual(
    workflowNodeStatusChannelName("workflow-1"),
    workflowNodeStatusChannelName("workflow-2"),
  );
});
