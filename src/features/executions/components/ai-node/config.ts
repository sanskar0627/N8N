import { CredentialType, NodeType } from "@/generated/prisma/enums";

export const AI_NODE_TYPES = [
  NodeType.OPENAI,
  NodeType.ANTHROPIC,
  NodeType.GEMINI,
] as const;

export type AiNodeType = (typeof AI_NODE_TYPES)[number];

export const AI_NODE_CONFIG = {
  [NodeType.OPENAI]: {
    name: "OpenAI",
    credentialLabel: "OpenRouter credential",
    credentialPlaceholder: "sk-or-v1-...",
    credentialType: CredentialType.OPENROUTER,
    defaultModel: "openai/gpt-4o-mini",
    outputField: "openAIResponse",
    icon: "/logos/openai.svg",
  },
  [NodeType.ANTHROPIC]: {
    name: "Anthropic",
    credentialLabel: "Anthropic credential",
    credentialPlaceholder: "sk-ant-...",
    credentialType: CredentialType.ANTHROPIC,
    defaultModel: "claude-sonnet-4-20250514",
    outputField: "anthropicResponse",
    icon: "/logos/anthropic.svg",
  },
  [NodeType.GEMINI]: {
    name: "Gemini",
    credentialLabel: "Google AI credential",
    credentialPlaceholder: "AIza...",
    credentialType: CredentialType.GEMINI,
    defaultModel: "gemini-2.0-flash",
    outputField: "geminiResponse",
    icon: "/logos/gemini.svg",
  },
} as const;

export const isAiNodeType = (value: string): value is AiNodeType =>
  AI_NODE_TYPES.some((nodeType) => nodeType === value);
