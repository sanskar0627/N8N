const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|password|token|authorization|webhookurl)$/i;

const UNSAFE_PATH_PARTS = new Set(["__proto__", "constructor", "prototype"]);

export const redactExecutionOutput = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactExecutionOutput(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (UNSAFE_PATH_PARTS.has(key)) {
      continue;
    }

    result[key] = SECRET_KEY_PATTERN.test(key)
      ? "[redacted]"
      : redactExecutionOutput(child);
  }

  return result;
};
