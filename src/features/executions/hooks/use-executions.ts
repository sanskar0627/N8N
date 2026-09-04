"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useExecutionsParams } from "./use-executions-params";

export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  return useSuspenseQuery(
    trpc.executions.getMany.queryOptions({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      workflowId: params.workflowId || undefined,
      status: params.status ?? undefined,
    }),
  );
};

export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.executions.getOne.queryOptions({ id }));
};
