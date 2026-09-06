import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type ListInput = inferInput<typeof trpc.credentials.getMany>;

export const prefetchCredentials = (params: ListInput) =>
  prefetch(trpc.credentials.getMany.queryOptions(params));

export const prefetchCredential = (id: string) =>
  prefetch(trpc.credentials.getOne.queryOptions({ id }));
