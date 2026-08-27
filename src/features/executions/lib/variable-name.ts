import { z } from "zod";

const VARIABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const variableNameSchema = z
  .string()
  .min(1, "Variable name is required")
  .regex(VARIABLE_NAME_PATTERN, {
    message:
      "Variable name must start with a letter or underscore and can only contain letters, numbers, and underscores",
  });

type NodeWithData = {
  data?: Record<string, unknown>;
};

export const findDuplicateVariableNames = (nodes: NodeWithData[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const node of nodes) {
    const variableName = node.data?.variableName;

    if (typeof variableName !== "string" || variableName.length === 0) {
      continue;
    }

    if (seen.has(variableName)) {
      duplicates.add(variableName);
    } else {
      seen.add(variableName);
    }
  }

  return [...duplicates];
};
