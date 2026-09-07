import { NonRetriableError } from "inngest";

export const MAX_HTTP_RESPONSE_BYTES = 1_048_576;

const readLimitedBytes = async (response: Response, maxBytes: number) => {
  if (!response.body) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }

      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        throw new NonRetriableError(
          "HTTP Request node: Response body is too large.",
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
};

export const readLimitedResponseBody = async (response: Response) => {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_HTTP_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new NonRetriableError(
      "HTTP Request node: Response body is too large.",
    );
  }

  if ([204, 205, 304].includes(response.status)) {
    return null;
  }

  const bytes = await readLimitedBytes(response, MAX_HTTP_RESPONSE_BYTES);
  if (bytes.byteLength === 0) {
    return null;
  }

  const text = new TextDecoder().decode(bytes);
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new NonRetriableError(
        "HTTP Request node: Response body is not valid JSON.",
        { cause: error },
      );
    }
  }

  return text;
};
