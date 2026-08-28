import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import type { WorkflowContext } from "@/features/executions/types";

const MAX_CACHED_TEMPLATES = 500;
const templateEngine = Handlebars.create();
const templateCache = new Map<string, ReturnType<typeof Handlebars.compile>>();

templateEngine.registerHelper("json", (value: unknown) => {
  const serialized = JSON.stringify(value);
  return new Handlebars.SafeString(serialized ?? "null");
});

const getCompiledTemplate = (template: string) => {
  const cached = templateCache.get(template);
  if (cached) {
    templateCache.delete(template);
    templateCache.set(template, cached);
    return cached;
  }

  const compiled = templateEngine.compile(template, { noEscape: true });

  if (templateCache.size >= MAX_CACHED_TEMPLATES) {
    const oldestKey = templateCache.keys().next().value;
    if (oldestKey !== undefined) {
      templateCache.delete(oldestKey);
    }
  }

  templateCache.set(template, compiled);
  return compiled;
};

export const resolveTemplate = (
  template: string,
  context: WorkflowContext,
  fieldName = "value",
) => {
  try {
    return getCompiledTemplate(template)(context);
  } catch (error) {
    throw new NonRetriableError(`Invalid template in ${fieldName}`, {
      cause: error,
    });
  }
};
