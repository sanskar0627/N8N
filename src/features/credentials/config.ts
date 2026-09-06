import { CredentialType, NodeType } from "@/generated/prisma/enums";

export const CREDENTIAL_TYPES = [
  CredentialType.OPENROUTER,
  CredentialType.ANTHROPIC,
  CredentialType.GEMINI,
  CredentialType.DISCORD,
  CredentialType.SLACK,
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
  [CredentialType.DISCORD]: {
    label: "Discord",
    description: "Webhook URL used by Discord nodes",
    placeholder: "https://discord.com/api/webhooks/...",
    icon: "/logos/discord.svg",
  },
  [CredentialType.SLACK]: {
    label: "Slack",
    description: "Webhook URL used by Slack nodes",
    placeholder: "https://hooks.slack.com/services/...",
    icon: "/logos/slack.svg",
  },
} as const;

export const AI_NODE_CREDENTIAL_TYPES = {
  [NodeType.OPENAI]: CredentialType.OPENROUTER,
  [NodeType.ANTHROPIC]: CredentialType.ANTHROPIC,
  [NodeType.GEMINI]: CredentialType.GEMINI,
} as const;

export const WEBHOOK_NODE_CREDENTIAL_TYPES = {
  [NodeType.DISCORD]: CredentialType.DISCORD,
  [NodeType.SLACK]: CredentialType.SLACK,
} as const;

export const NODE_CREDENTIAL_TYPES = {
  ...AI_NODE_CREDENTIAL_TYPES,
  ...WEBHOOK_NODE_CREDENTIAL_TYPES,
} as const;

export type SupportedCredentialType = (typeof CREDENTIAL_TYPES)[number];
export type CredentialNodeType = keyof typeof NODE_CREDENTIAL_TYPES;

export const isCredentialNodeType = (
  value: string,
): value is CredentialNodeType => Object.hasOwn(NODE_CREDENTIAL_TYPES, value);

export const getCredentialTypeForNode = (nodeType: CredentialNodeType) =>
  NODE_CREDENTIAL_TYPES[nodeType];

export const getCredentialTypeForAiNode = (
  nodeType: keyof typeof AI_NODE_CREDENTIAL_TYPES,
) => AI_NODE_CREDENTIAL_TYPES[nodeType];
