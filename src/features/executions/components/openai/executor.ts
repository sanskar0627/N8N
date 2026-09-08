import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { getGeneratedText } from "@/features/executions/lib/generated-text";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";

type OpenAIData = {
  variableName?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const openaiExecutor: NodeExecutor<OpenAIData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  if (!data.variableName) {
    throw new NonRetriableError("OpenAI Node: Variable name is required");
  }

  if (!data.apiKey) {
    throw new NonRetriableError("OpenAI Node: API key is required");
  }

  if (!data.userPrompt) {
    throw new NonRetriableError("OpenAI Node: User prompt is required");
  }

  const systemPrompt = data.systemPrompt
    ? resolveTemplate(data.systemPrompt, context, "system prompt")
    : "You are a helpful assistant.";
  const userPrompt = resolveTemplate(data.userPrompt, context, "user prompt");

  const openrouter = createOpenRouter({ apiKey: data.apiKey });

  try {
    const result = await step.ai.wrap(
      nodeStepId("openai-generate-text", nodeId),
      generateText,
      {
        model: openrouter(data.model || "openai/gpt-4o-mini"),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: signal,
      },
    );

    return {
      ...context,
      [data.variableName]: { openAIResponse: getGeneratedText(result) },
    };
  } catch (error) {
    throw new NonRetriableError("OpenAI Node: execution failed", {
      cause: error,
    });
  }
};
