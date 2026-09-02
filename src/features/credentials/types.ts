import type { CredentialType } from "@/generated/prisma/enums";

export interface PublicCredential {
  id: string;
  name: string;
  type: CredentialType;
  createdAt: Date;
  updatedAt: Date;
}
