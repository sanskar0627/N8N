import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { slackChannel } from "@/inngest/channels/slack";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

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

  const content = Handlebars.compile(data.content)(context);

  try {
    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Slack Node: Webhook URL is required");
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
    throw new NonRetriableError("Slack Node: execution failed", {
      cause: error,
    });
  }
};
