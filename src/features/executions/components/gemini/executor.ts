import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import Handlebars from "handlebars";
import { geminiChannel } from "@/inngest/channels/gemini";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

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
  publish,
}) => {
  await publish(geminiChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gemini Node: Variable name is required");
  }

  if (!data.apiKey) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gemini Node: API key is required");
  }

  if (!data.userPrompt) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gemini Node: User prompt is required");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";
  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const google = createGoogleGenerativeAI({ apiKey: data.apiKey });

  try {
    const { steps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google(data.model || "gemini-2.0-flash"),
        system: systemPrompt,
        prompt: userPrompt,
      },
    );

    const text =
      steps[0]?.content[0]?.type === "text" ? steps[0].content[0].text : "";

    await publish(geminiChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: { geminiResponse: text },
    };
  } catch (error) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gemini Node: execution failed", {
      cause: error,
    });
  }
};
