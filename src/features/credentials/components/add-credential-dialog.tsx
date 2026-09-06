"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicCredential } from "@/features/credentials/types";
import type { CredentialType } from "@/generated/prisma/enums";
import { CredentialForm } from "./credential-form";

interface AddCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CredentialType;
  onCreated: (credential: PublicCredential) => void;
}

export const AddCredentialDialog = ({
  open,
  onOpenChange,
  type,
  onCreated,
}: AddCredentialDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add credential</DialogTitle>
        <DialogDescription>
          Create a reusable credential without leaving the workflow editor.
        </DialogDescription>
      </DialogHeader>
      <CredentialForm
        compact
        defaultType={type}
        onCancel={() => onOpenChange(false)}
        onSuccess={(credential) => {
          onCreated(credential);
          onOpenChange(false);
        }}
      />
    </DialogContent>
  </Dialog>
);
