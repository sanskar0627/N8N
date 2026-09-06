import type { CredentialType } from "@/generated/prisma/enums";
import {
  type CredentialNodeType,
  getCredentialTypeForNode,
  isCredentialNodeType,
} from "../config";

export type NodeCredentialRef = {
  nodeType: CredentialNodeType;
  credentialId: string;
};

type NodeLike = {
  type?: string | null;
  data?: Record<string, unknown>;
};

export const collectNodeCredentialRefs = (
  nodes: NodeLike[],
): NodeCredentialRef[] => {
  const refs: NodeCredentialRef[] = [];

  for (const node of nodes) {
    if (!node.type || !isCredentialNodeType(node.type)) {
      continue;
    }

    const credentialId = node.data?.credentialId;
    if (typeof credentialId !== "string" || credentialId.length === 0) {
      continue;
    }

    refs.push({
      nodeType: node.type,
      credentialId,
    });
  }

  return refs;
};

export const findInvalidNodeCredentialRef = (
  refs: NodeCredentialRef[],
  credentials: Array<{ id: string; type: CredentialType }>,
) => {
  const byId = new Map(
    credentials.map((credential) => [credential.id, credential]),
  );

  for (const ref of refs) {
    const credential = byId.get(ref.credentialId);
    if (!credential) {
      return "Selected credential was not found";
    }

    if (credential.type !== getCredentialTypeForNode(ref.nodeType)) {
      return "Credential type does not match this node";
    }
  }

  return null;
};

export const collectAiCredentialRefs = collectNodeCredentialRefs;
export const findInvalidAiCredentialRef = findInvalidNodeCredentialRef;
