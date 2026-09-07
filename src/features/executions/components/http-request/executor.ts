import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import { readLimitedResponseBody } from "@/features/executions/lib/limited-response";
import { createPinnedFetch } from "@/features/executions/lib/pinned-fetch";
import {
  assertSafeHttpUrl,
  sanitizeHttpHeaders,
} from "@/features/executions/lib/safe-http-url";
import { nodeStepId } from "@/features/executions/lib/step-id";
import { resolveTemplate } from "@/features/executions/lib/template";
import type { NodeExecutor } from "@/features/executions/types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: HttpMethod;
  body?: string;
  headers?: Array<{ key: string; value: string }>;
};

const MAX_REDIRECTS = 5;

const resolveUserHeaders = (
  headers: Array<{ key: string; value: string }> | undefined,
  context: Record<string, unknown>,
) => {
  const userHeaders: Record<string, string> = {};
  if (!headers?.length) {
    return userHeaders;
  }

  for (const header of headers) {
    if (!header.key) {
      continue;
    }
    userHeaders[header.key] = resolveTemplate(
      header.value,
      context,
      `header "${header.key}"`,
    );
  }

  return sanitizeHttpHeaders(userHeaders);
};

const followRedirect = (
  status: number,
  method: HttpMethod,
): HttpMethod | null => {
  if (![301, 302, 303, 307, 308].includes(status)) {
    return null;
  }

  if ([301, 302, 303].includes(status) && method !== "GET") {
    return "GET";
  }

  return method;
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  signal,
}) => {
  try {
    const result = await step.run(
      nodeStepId("http-request", nodeId),
      async () => {
        if (!data?.variableName) {
          throw new NonRetriableError(
            "HTTP Request node: No variable name configured.",
          );
        }

        if (!data?.endpoint) {
          throw new NonRetriableError(
            "HTTP Request node: No endpoint configured.",
          );
        }

        if (!data?.method) {
          throw new NonRetriableError(
            "HTTP Request node: No method configured.",
          );
        }

        let requestUrl = await assertSafeHttpUrl(
          resolveTemplate(data.endpoint, context, "endpoint"),
        );
        let method = data.method;
        const userHeaders = resolveUserHeaders(data.headers, context);
        let body: string | undefined;

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
          body = resolved;
        }

        let response: Response | undefined;

        for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
          const options: KyOptions = {
            method,
            headers: {
              ...(body ? { "Content-Type": "application/json" } : {}),
              ...userHeaders,
            },
            body,
            redirect: "manual",
            timeout: false,
            throwHttpErrors: false,
            signal,
            fetch: createPinnedFetch(requestUrl.addresses),
          };

          response = await ky(requestUrl.url.toString(), options);
          const nextMethod = followRedirect(response.status, method);
          if (!nextMethod) {
            break;
          }

          if (hop === MAX_REDIRECTS) {
            throw new NonRetriableError(
              "HTTP Request node: Too many redirects.",
            );
          }

          const location = response.headers.get("location");
          if (!location) {
            throw new NonRetriableError(
              "HTTP Request node: Redirect is missing a Location header.",
            );
          }

          requestUrl = await assertSafeHttpUrl(
            new URL(location, requestUrl.url).toString(),
          );
          if (nextMethod === "GET") {
            body = undefined;
          }
          method = nextMethod;
        }

        if (!response) {
          throw new NonRetriableError(
            "HTTP Request node: No response was received.",
          );
        }

        if (response.status >= 500) {
          throw new Error(
            `HTTP Request node: Request failed with status ${response.status}`,
          );
        }

        if (!response.ok) {
          throw new NonRetriableError(
            `HTTP Request node: Request failed with status ${response.status}`,
          );
        }

        const responseData = await readLimitedResponseBody(response);

        return {
          ...context,
          [data.variableName]: {
            status: response.status,
            statusText: response.statusText,
            httpResponse: {
              data: responseData,
            },
          },
        };
      },
    );

    return result;
  } catch (error) {
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError(
      error instanceof Error
        ? error.message
        : "HTTP Request node: execution failed",
      { cause: error },
    );
  }
};
