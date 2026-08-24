import prisma from "@/lib/db";
import { inngest } from "./client";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const google = createGoogleGenerativeAI();
const anthropic = createAnthropic();
const openrouter = createOpenRouter();

export const execute = inngest.createFunction(
  { id: "execute-ai", triggers: [{ event: "execute/ai" }] },
  async ({ event, step }) => {
    await step.sleep("pretend", "5s");

    console.warn("Something is missing");
    console.error("This is an error i want to track");

    const { steps: geminiSteps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-3.6-flash"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    const { steps: openrouterSteps } = await step.ai.wrap(
      "openrouter-generate-text",
      generateText,
      {
        model: openrouter("nvidia/nemotron-3.5-lightning:free"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    const { steps: anthropicSteps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-sonnet-4-5"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    return {
      geminiSteps,
      openrouterSteps,
      anthropicSteps,
    };
  },
);
