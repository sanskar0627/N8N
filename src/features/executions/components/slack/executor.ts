import { NonRetriableError } from "inngest";
import ky from "ky";
import { isAllowedWebhookUrl } from "@/features/credentials/lib/webhook-url";
import { WEBHOOK_MESSAGE_CONFIG } from "@/features/executions/components/webhook-message/config";
import { buildSlackWebhookPayload } from "@/features/executions/lib/slack-payload";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";
import { CredentialType } from "@/generated/prisma/enums";

type SlackData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
};

export const slackExecutor: NodeExecutor<SlackData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  if (!data.content) {
    throw new NonRetriableError("Slack Node: Content is required");
  }

  try {
    const content = resolveTemplate(data.content, context, "message content");

    return await step.run(nodeStepId("slack-webhook", nodeId), async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Slack Node: Webhook URL is required");
      }

      if (!isAllowedWebhookUrl(data.webhookUrl, CredentialType.SLACK)) {
        throw new NonRetriableError("Slack Node: Webhook URL is invalid");
      }

      if (!data.variableName) {
        throw new NonRetriableError("Slack Node: Variable name is required");
      }

      const message = content.slice(0, WEBHOOK_MESSAGE_CONFIG.SLACK.contentMax);

      await ky.post(data.webhookUrl, {
        json: buildSlackWebhookPayload(message),
        signal,
      });

      return {
        ...context,
        [data.variableName]: {
          slackMessageContent: message,
          slackMessageSent: true,
        },
      };
    });
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Slack Node: execution failed", {
      cause: error,
    });
  }
};
