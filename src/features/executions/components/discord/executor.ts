import { NonRetriableError } from "inngest";
import ky from "ky";
import { isAllowedWebhookUrl } from "@/features/credentials/lib/webhook-url";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";
import { CredentialType } from "@/generated/prisma/enums";

type DiscordData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

export const discordExecutor: NodeExecutor<DiscordData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  if (!data.content) {
    throw new NonRetriableError("Discord Node: Content is required");
  }

  try {
    const content = resolveTemplate(data.content, context, "message content");
    const username = data.username
      ? resolveTemplate(data.username, context, "username")
      : "M9M";

    return await step.run(nodeStepId("discord-webhook", nodeId), async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Discord Node: Webhook URL is required");
      }

      if (!isAllowedWebhookUrl(data.webhookUrl, CredentialType.DISCORD)) {
        throw new NonRetriableError("Discord Node: Webhook URL is invalid");
      }

      if (!data.variableName) {
        throw new NonRetriableError("Discord Node: Variable name is required");
      }

      await ky.post(data.webhookUrl, {
        json: {
          content: content.slice(0, 2000),
          username,
        },
        signal,
      });

      return {
        ...context,
        [data.variableName]: {
          discordMessageContent: content.slice(0, 2000),
          discordMessageSent: true,
        },
      };
    });
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Discord Node: execution failed", {
      cause: error,
    });
  }
};
