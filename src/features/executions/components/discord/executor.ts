import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { discordChannel } from "@/inngest/channels/discord";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context));
});

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
  publish,
}) => {
  await publish(discordChannel().status({ nodeId, status: "loading" }));

  if (!data.content) {
    await publish(discordChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Discord Node: Content is required");
  }

  const content = Handlebars.compile(data.content)(context);
  const username = data.username
    ? Handlebars.compile(data.username)(context)
    : "M9M";

  try {
    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        throw new NonRetriableError("Discord Node: Webhook URL is required");
      }

      if (!data.variableName) {
        throw new NonRetriableError("Discord Node: Variable name is required");
      }

      await ky.post(data.webhookUrl, {
        json: {
          content: content.slice(0, 2000),
          username,
        },
      });

      return {
        ...context,
        [data.variableName]: {
          discordMessageContent: content.slice(0, 2000),
          discordMessageSent: true,
        },
      };
    });

    await publish(discordChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(discordChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Discord Node: execution failed", {
      cause: error,
    });
  }
};
