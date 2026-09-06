"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export const useExecuteNode = () => {
  const trpc = useTRPC();
  return useMutation(trpc.workflows.executeNode.mutationOptions({}));
};
