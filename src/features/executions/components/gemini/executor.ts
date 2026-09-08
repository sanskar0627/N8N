import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { getGeneratedText } from "@/features/executions/lib/generated-text";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";

type GeminiData = {
  variableName?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  if (!data.variableName) {
    throw new NonRetriableError("Gemini Node: Variable name is required");
  }

  if (!data.apiKey) {
    throw new NonRetriableError("Gemini Node: API key is required");
  }

  if (!data.userPrompt) {
    throw new NonRetriableError("Gemini Node: User prompt is required");
  }

  try {
    const systemPrompt = data.systemPrompt
      ? resolveTemplate(data.systemPrompt, context, "system prompt")
      : "You are a helpful assistant.";
    const userPrompt = resolveTemplate(data.userPrompt, context, "user prompt");
    const google = createGoogleGenerativeAI({ apiKey: data.apiKey });

    const result = await step.ai.wrap(
      nodeStepId("gemini-generate-text", nodeId),
      generateText,
      {
        model: google(data.model || "gemini-2.0-flash"),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: signal,
      },
    );

    const text = getGeneratedText(result);

    return {
      ...context,
      [data.variableName]: { geminiResponse: text },
    };
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Gemini Node: execution failed", {
      cause: error,
    });
  }
};
