import { NodeType } from "@/generated/prisma/enums";

export const WEBHOOK_MESSAGE_NODE_TYPES = [
  NodeType.DISCORD,
  NodeType.SLACK,
] as const;

export type WebhookMessageNodeType =
  (typeof WEBHOOK_MESSAGE_NODE_TYPES)[number];

export const WEBHOOK_MESSAGE_CONFIG = {
  [NodeType.DISCORD]: {
    name: "Discord",
    credentialLabel: "Discord webhook",
    contentMax: 2_000,
    outputField: "discordMessageContent",
    hasUsername: true,
    icon: "/logos/discord.svg",
    setupSteps: [
      "Open the Discord channel, then Integrations → Webhooks",
      "Create a webhook and copy its URL",
      "Save that URL as a Discord credential",
    ],
  },
  [NodeType.SLACK]: {
    name: "Slack",
    credentialLabel: "Slack webhook",
    contentMax: 4_000,
    outputField: "slackMessageContent",
    hasUsername: false,
    icon: "/logos/slack.svg",
    setupSteps: [
      "Create a Slack incoming webhook or a workflow that starts from a webhook",
      "Copy the HTTPS webhook URL",
      "Save that URL as a Slack credential. Incoming webhooks use text; workflow webhooks also receive content",
    ],
  },
} as const;

export const isWebhookMessageNodeType = (
  value: string,
): value is WebhookMessageNodeType =>
  WEBHOOK_MESSAGE_NODE_TYPES.some((nodeType) => nodeType === value);
