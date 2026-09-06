import { NonRetriableError } from "inngest";
import { isAiNodeType } from "@/features/executions/components/ai-node/config";
import type { CredentialType, NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { getCredentialTypeForAiNode } from "../config";
import { readCredentialValue } from "./credential-value";

type CredentialLookup = (input: {
  id: string;
  userId: string;
  type: CredentialType;
}) => Promise<{ value: string } | null>;

const findCredential: CredentialLookup = ({ id, userId, type }) =>
  prisma.credential.findFirst({
    where: { id, userId, type },
    select: { value: true },
  });

export const hydrateAiNodeData = async (
  {
    nodeType,
    data,
    userId,
  }: {
    nodeType: NodeType;
    data: Record<string, unknown>;
    userId: string;
  },
  lookup: CredentialLookup = findCredential,
) => {
  if (!isAiNodeType(nodeType)) {
    return data;
  }

  if (typeof data.apiKey === "string" && data.apiKey.length > 0) {
    return data;
  }

  if (typeof data.credentialId !== "string" || data.credentialId.length === 0) {
    return data;
  }

  const credential = await lookup({
    id: data.credentialId,
    userId,
    type: getCredentialTypeForAiNode(nodeType),
  });

  if (!credential) {
    throw new NonRetriableError(
      "Credential not found or incompatible with this AI node",
    );
  }

  return {
    ...data,
    apiKey: readCredentialValue(credential.value),
  };
};
