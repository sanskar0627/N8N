import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type ListInput = inferInput<typeof trpc.executions.getMany>;

export const prefetchExecutions = (params: ListInput) =>
  prefetch(trpc.executions.getMany.queryOptions(params));

export const prefetchExecution = (id: string) =>
  prefetch(trpc.executions.getOne.queryOptions({ id }));
