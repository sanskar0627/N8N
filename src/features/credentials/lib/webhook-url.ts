import { CredentialType } from "@/generated/prisma/enums";

export const WEBHOOK_CREDENTIAL_TYPES = [
  CredentialType.DISCORD,
  CredentialType.SLACK,
] as const;

export type WebhookCredentialType = (typeof WEBHOOK_CREDENTIAL_TYPES)[number];

export const isWebhookCredentialType = (
  value: string,
): value is WebhookCredentialType =>
  WEBHOOK_CREDENTIAL_TYPES.some((type) => type === value);

const isHttpsUrl = (value: URL) => value.protocol === "https:";

export const isAllowedWebhookUrl = (
  value: string,
  type: WebhookCredentialType,
) => {
  try {
    const url = new URL(value);
    if (!isHttpsUrl(url) || url.username || url.password) {
      return false;
    }

    if (type === CredentialType.DISCORD) {
      return (
        (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
        url.pathname.startsWith("/api/webhooks/") &&
        url.pathname.length > "/api/webhooks/".length
      );
    }

    return (
      url.hostname === "hooks.slack.com" &&
      (url.pathname.startsWith("/services/") ||
        url.pathname.startsWith("/triggers/")) &&
      url.pathname.split("/").length >= 4
    );
  } catch {
    return false;
  }
};
