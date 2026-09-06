"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { CredentialType } from "@/generated/prisma/enums";
import { useTRPC } from "@/trpc/client";
import { useCredentialsParams } from "./use-credentials-params";

export const useSuspenseCredentials = () => {
  const trpc = useTRPC();
  const [params] = useCredentialsParams();
  return useSuspenseQuery(trpc.credentials.getMany.queryOptions(params));
};

export const useSuspenseCredential = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.credentials.getOne.queryOptions({ id }));
};

export const useCredentialsByType = (type: CredentialType, enabled = true) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.credentials.getByType.queryOptions({ type }),
    enabled,
  });
};

export const useCreateCredential = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: (credential) => {
        toast.success(`Credential "${credential.name}" created`);
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getByType.queryOptions({ type: credential.type }),
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );
};

export const useUpdateCredential = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: (credential) => {
        toast.success(`Credential "${credential.name}" updated`);
        queryClient.invalidateQueries(
          trpc.credentials.getOne.queryOptions({ id: credential.id }),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getByType.queryOptions({ type: credential.type }),
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );
};

export const useRemoveCredential = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: (credential) => {
        toast.success(`Credential "${credential.name}" deleted`);
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getByType.queryOptions({ type: credential.type }),
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );
};
