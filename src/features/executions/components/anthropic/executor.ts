import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { getGeneratedText } from "@/features/executions/lib/generated-text";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";

type AnthropicData = {
  variableName?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  if (!data.variableName) {
    throw new NonRetriableError("Anthropic Node: Variable name is required");
  }

  if (!data.apiKey) {
    throw new NonRetriableError("Anthropic Node: API key is required");
  }

  if (!data.userPrompt) {
    throw new NonRetriableError("Anthropic Node: User prompt is required");
  }

  const systemPrompt = data.systemPrompt
    ? resolveTemplate(data.systemPrompt, context, "system prompt")
    : "You are a helpful assistant.";
  const userPrompt = resolveTemplate(data.userPrompt, context, "user prompt");

  const anthropic = createAnthropic({ apiKey: data.apiKey });

  try {
    const result = await step.ai.wrap(
      nodeStepId("anthropic-generate-text", nodeId),
      generateText,
      {
        model: anthropic(data.model || "claude-sonnet-4-20250514"),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: signal,
      },
    );

    return {
      ...context,
      [data.variableName]: { anthropicResponse: getGeneratedText(result) },
    };
  } catch (error) {
    throw new NonRetriableError("Anthropic Node: execution failed", {
      cause: error,
    });
  }
};
