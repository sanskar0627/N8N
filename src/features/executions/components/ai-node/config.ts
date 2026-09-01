import { NodeType } from "@/generated/prisma/enums";

export const AI_NODE_TYPES = [
  NodeType.OPENAI,
  NodeType.ANTHROPIC,
  NodeType.GEMINI,
] as const;

export type AiNodeType = (typeof AI_NODE_TYPES)[number];

export const AI_NODE_CONFIG = {
  [NodeType.OPENAI]: {
    name: "OpenAI",
    credentialLabel: "OpenRouter API key",
    credentialPlaceholder: "sk-or-v1-...",
    defaultModel: "openai/gpt-4o-mini",
    outputField: "openAIResponse",
    icon: "/logos/openai.svg",
  },
  [NodeType.ANTHROPIC]: {
    name: "Anthropic",
    credentialLabel: "Anthropic API key",
    credentialPlaceholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-20250514",
    outputField: "anthropicResponse",
    icon: "/logos/anthropic.svg",
  },
  [NodeType.GEMINI]: {
    name: "Gemini",
    credentialLabel: "Google AI API key",
    credentialPlaceholder: "AIza...",
    defaultModel: "gemini-2.0-flash",
    outputField: "geminiResponse",
    icon: "/logos/gemini.svg",
  },
} as const;

export const isAiNodeType = (value: string): value is AiNodeType =>
  AI_NODE_TYPES.some((nodeType) => nodeType === value);
