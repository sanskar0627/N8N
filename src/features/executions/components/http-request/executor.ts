import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";

type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
  headers?: Array<{ key: string; value: string }>;
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    const result = await step.run("http-request", async () => {
      if (!data?.variableName) {
        await publish(httpRequestChannel().status({ nodeId, status: "error" }));
        throw new NonRetriableError(
          "HTTP Request node: No variable name configured.",
        );
      }

      if (!data?.endpoint) {
        await publish(httpRequestChannel().status({ nodeId, status: "error" }));
        throw new NonRetriableError(
          "HTTP Request node: No endpoint configured.",
        );
      }

      if (!data?.method) {
        await publish(httpRequestChannel().status({ nodeId, status: "error" }));
        throw new NonRetriableError("HTTP Request node: No method configured.");
      }

      const endpoint = resolveTemplate(data.endpoint, context, "endpoint");
      let parsedEndpoint: URL;
      try {
        parsedEndpoint = new URL(endpoint);
      } catch (error) {
        throw new NonRetriableError(
          "HTTP Request node: Endpoint must resolve to a valid URL.",
          { cause: error },
        );
      }
      if (!["http:", "https:"].includes(parsedEndpoint.protocol)) {
        throw new NonRetriableError(
          "HTTP Request node: Endpoint must use HTTP or HTTPS.",
        );
      }
      const method = data.method;

      const userHeaders: Record<string, string> = {};
      if (data.headers && data.headers.length > 0) {
        for (const header of data.headers) {
          if (header.key) {
            const resolvedValue = resolveTemplate(
              header.value,
              context,
              `header "${header.key}"`,
            );
            userHeaders[header.key] = resolvedValue;
          }
        }
      }

      const options: KyOptions = {
        method,
        headers: { ...userHeaders },
      };

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = resolveTemplate(
          data.body || "{}",
          context,
          "request body",
        );
        try {
          JSON.parse(resolved);
        } catch (error) {
          throw new NonRetriableError(
            "HTTP Request node: Body must resolve to valid JSON.",
            { cause: error },
          );
        }
        options.body = resolved;
        options.headers = {
          "Content-Type": "application/json",
          ...userHeaders,
        };
      }

      const response = await ky(endpoint, options);
      const responseData = response.headers
        .get("Content-Type")
        ?.includes("application/json")
        ? await response.json()
        : await response.text();

      const responsePayload = {
        status: response.status,
        statusText: response.statusText,
        httpResponse: {
          data: responseData,
        },
      };

      return {
        ...context,
        [data.variableName]: responsePayload,
      };
    });

    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
