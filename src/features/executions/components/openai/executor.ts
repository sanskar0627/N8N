import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import Handlebars from "handlebars";
import { openAIChannel } from "@/inngest/channels/openai";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

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
  publish,
}) => {
  await publish(openAIChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(openAIChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI Node: Variable name is required");
  }

  if (!data.apiKey) {
    await publish(openAIChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI Node: API key is required");
  }

  if (!data.userPrompt) {
    await publish(openAIChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI Node: User prompt is required");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";
  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const openrouter = createOpenRouter({ apiKey: data.apiKey });

  try {
    const { steps } = await step.ai.wrap(
      "openai-generate-text",
      generateText,
      {
        model: openrouter(data.model || "openai/gpt-4o-mini"),
        system: systemPrompt,
        prompt: userPrompt,
      },
    );

    const text =
      steps[0]?.content[0]?.type === "text" ? steps[0].content[0].text : "";

    await publish(openAIChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: { openAIResponse: text },
    };
  } catch (error) {
    await publish(openAIChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI Node: execution failed", {
      cause: error,
    });
  }
};
