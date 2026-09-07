import { NonRetriableError } from "inngest";
import type { CredentialType, NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import {
  getCredentialTypeForNode,
  isCredentialNodeType,
  WEBHOOK_NODE_CREDENTIAL_TYPES,
} from "../config";
import { readCredentialValue } from "./credential-value";
import { readNodeSecret } from "./node-secret";
import { isAllowedWebhookUrl, isWebhookCredentialType } from "./webhook-url";

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

const secretFieldForNode = (nodeType: NodeType) => {
  if (nodeType in WEBHOOK_NODE_CREDENTIAL_TYPES) {
    return "webhookUrl";
  }

  return "apiKey";
};

export const hydrateNodeData = async (
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
  if (!isCredentialNodeType(nodeType)) {
    return data;
  }

  const secretField = secretFieldForNode(nodeType);
  const existingSecret = data[secretField];
  if (typeof existingSecret === "string" && existingSecret.length > 0) {
    return {
      ...data,
      [secretField]: readNodeSecret(existingSecret),
    };
  }

  if (typeof data.credentialId !== "string" || data.credentialId.length === 0) {
    return data;
  }

  const credentialType = getCredentialTypeForNode(nodeType);
  const credential = await lookup({
    id: data.credentialId,
    userId,
    type: credentialType,
  });

  if (!credential) {
    throw new NonRetriableError(
      "Credential not found or incompatible with this node",
    );
  }

  const value = readCredentialValue(credential.value);
  if (
    isWebhookCredentialType(credentialType) &&
    !isAllowedWebhookUrl(value, credentialType)
  ) {
    throw new NonRetriableError("Credential webhook URL is invalid");
  }

  return {
    ...data,
    [secretField]: value,
  };
};

export const hydrateAiNodeData = hydrateNodeData;
