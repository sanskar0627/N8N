import {
  type AiNodeType,
  isAiNodeType,
} from "@/features/executions/components/ai-node/config";
import type { CredentialType } from "@/generated/prisma/enums";
import { getCredentialTypeForAiNode } from "../config";

export type AiCredentialRef = {
  nodeType: AiNodeType;
  credentialId: string;
};

type NodeLike = {
  type?: string | null;
  data?: Record<string, unknown>;
};

export const collectAiCredentialRefs = (
  nodes: NodeLike[],
): AiCredentialRef[] => {
  const refs: AiCredentialRef[] = [];

  for (const node of nodes) {
    if (!node.type || !isAiNodeType(node.type)) {
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

export const findInvalidAiCredentialRef = (
  refs: AiCredentialRef[],
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

    if (credential.type !== getCredentialTypeForAiNode(ref.nodeType)) {
      return "Credential type does not match this AI node";
    }
  }

  return null;
};
