"use client";

import { notFound } from "next/navigation";
import { CREDENTIAL_CONFIG } from "../config";
import { useSuspenseCredential } from "../hooks/use-credentials";
import { CredentialForm } from "./credential-form";

export const CredentialView = ({ credentialId }: { credentialId: string }) => {
  const { data: credential } = useSuspenseCredential(credentialId);

  if (!credential) {
    notFound();
  }

  const config = CREDENTIAL_CONFIG[credential.type];

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">{credential.name}</h1>
        <p className="text-sm text-muted-foreground">
          Update this {config.label} credential. The secret value stays
          write-only.
        </p>
      </div>
      <CredentialForm initialData={credential} />
    </>
  );
};
