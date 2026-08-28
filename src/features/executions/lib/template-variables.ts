import Handlebars from "handlebars";
import type { WorkflowContext } from "@/features/executions/types";

type AstValue = {
  type?: string;
  original?: string;
  params?: AstValue[];
  [key: string]: unknown;
};

const UNSAFE_PATH_PARTS = new Set(["__proto__", "constructor", "prototype"]);

const isContextPath = (path: string) =>
  path.length > 0 &&
  !path.startsWith("@") &&
  !path.startsWith("../") &&
  path !== "this";

const collectTemplatePaths = (template: string, paths: Set<string>) => {
  const ast = Handlebars.parse(template) as unknown as AstValue;

  const visit = (
    value: unknown,
    parent?: AstValue,
    parentKey?: string,
  ): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        visit(item, parent, parentKey);
      });
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const node = value as AstValue;
    if (node.type === "PathExpression" && node.original) {
      const isHelperName =
        parentKey === "path" &&
        (parent?.type === "BlockStatement" ||
          parent?.type === "SubExpression" ||
          ((parent?.type === "MustacheStatement" ||
            parent?.type === "Decorator") &&
            (parent.params?.length ?? 0) > 0));

      if (!isHelperName && isContextPath(node.original)) {
        paths.add(node.original);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key !== "loc") {
        visit(child, node, key);
      }
    }
  };

  visit(ast);
};

export const extractTemplateVariables = (
  data: Record<string, unknown>,
): string[] => {
  const paths = new Set<string>();

  const searchValue = (value: unknown): void => {
    if (typeof value === "string" && value.includes("{{")) {
      try {
        collectTemplatePaths(value, paths);
      } catch {
        // Invalid templates are reported by the executor with field context.
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(searchValue);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(searchValue);
    }
  };

  searchValue(data);
  return [...paths].sort();
};

const parseMockValue = (value: string): unknown => {
  if (value.trim() === "") {
    return "";
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const buildContextFromVariables = (
  values: Record<string, string>,
): WorkflowContext => {
  const context: WorkflowContext = {};
  const entries = Object.entries(values).sort(
    ([first], [second]) => first.split(".").length - second.split(".").length,
  );

  for (const [path, rawValue] of entries) {
    const parts = path.split(".").filter(Boolean);
    if (
      parts.length === 0 ||
      parts.some((part) => UNSAFE_PATH_PARTS.has(part))
    ) {
      continue;
    }

    let current = context;
    for (const part of parts.slice(0, -1)) {
      const existing = current[part];
      if (
        !existing ||
        typeof existing !== "object" ||
        Array.isArray(existing)
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts.at(-1);
    if (lastPart) {
      current[lastPart] = parseMockValue(rawValue);
    }
  }

  return context;
};
