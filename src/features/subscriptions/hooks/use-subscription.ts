import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export const useSubscription = () => {
  const trpc = useTRPC();

  return useQuery(
    trpc.billing.customerState.queryOptions({
      retry: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }),
  );
};

export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } =
    useSubscription();

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};
