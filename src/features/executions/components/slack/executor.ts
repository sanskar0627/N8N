import { NonRetriableError } from "inngest";
import ky from "ky";
import { isAllowedWebhookUrl } from "@/features/credentials/lib/webhook-url";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";
import { CredentialType } from "@/generated/prisma/enums";
import { slackChannel } from "@/inngest/channels/slack";

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
  publish,
}) => {
  await publish(slackChannel().status({ nodeId, status: "loading" }));

  if (!data.content) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Slack Node: Content is required");
  }

  try {
    const content = resolveTemplate(data.content, context, "message content");

    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Slack Node: Webhook URL is required");
      }

      if (!isAllowedWebhookUrl(data.webhookUrl, CredentialType.SLACK)) {
        throw new NonRetriableError("Slack Node: Webhook URL is invalid");
      }

      if (!data.variableName) {
        throw new NonRetriableError("Slack Node: Variable name is required");
      }

      await ky.post(data.webhookUrl, {
        json: { content },
      });

      return {
        ...context,
        [data.variableName]: {
          slackMessageContent: content.slice(0, 2000),
          slackMessageSent: true,
        },
      };
    });

    await publish(slackChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError("Slack Node: execution failed", {
      cause: error,
    });
  }
};
