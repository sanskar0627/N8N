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
    const { steps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-3.5-flash-lite"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
      }
    );

    return steps;
  },
);

export const executeAnthropic = inngest.createFunction(
  { id: "execute-anthropic", triggers: [{ event: "execute/anthropic" }] },
  async ({ event, step }) => {
    const { steps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-haiku-4-5"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
      }
    );

    return steps;
  },
);

export const executeOpenRouter = inngest.createFunction(
  { id: "execute-openrouter", triggers: [{ event: "execute/openrouter" }] },
  async ({ event, step }) => {
    const { steps } = await step.ai.wrap(
      "openrouter-generate-text",
      generateText,
      {
        model: openrouter("google/gemma-4-26b-a4b-it:free"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
      }
    );

    return steps;
  },
);
