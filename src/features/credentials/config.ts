import { CredentialType, NodeType } from "@/generated/prisma/enums";

export const CREDENTIAL_TYPES = [
  CredentialType.OPENROUTER,
  CredentialType.ANTHROPIC,
  CredentialType.GEMINI,
] as const;

export const CREDENTIAL_CONFIG = {
  [CredentialType.OPENROUTER]: {
    label: "OpenRouter",
    description: "Used by the OpenAI node",
    placeholder: "sk-or-v1-...",
    icon: "/logos/openai.svg",
  },
  [CredentialType.ANTHROPIC]: {
    label: "Anthropic",
    description: "Used by Anthropic text generation",
    placeholder: "sk-ant-...",
    icon: "/logos/anthropic.svg",
  },
  [CredentialType.GEMINI]: {
    label: "Google Gemini",
    description: "Used by Gemini text generation",
    placeholder: "AIza...",
    icon: "/logos/gemini.svg",
  },
} as const;

export const AI_NODE_CREDENTIAL_TYPES = {
  [NodeType.OPENAI]: CredentialType.OPENROUTER,
  [NodeType.ANTHROPIC]: CredentialType.ANTHROPIC,
  [NodeType.GEMINI]: CredentialType.GEMINI,
} as const;

export type SupportedCredentialType = (typeof CREDENTIAL_TYPES)[number];

export const getCredentialTypeForAiNode = (
  nodeType: keyof typeof AI_NODE_CREDENTIAL_TYPES,
) => AI_NODE_CREDENTIAL_TYPES[nodeType];
