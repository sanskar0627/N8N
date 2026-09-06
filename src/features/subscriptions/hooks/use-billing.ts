import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const openBillingUrl = (url: string) => {
  window.location.assign(url);
};

export const useBillingPortal = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.billing.portal.mutationOptions({
      onSuccess: ({ url }) => {
        openBillingUrl(url);
      },
      onError: (error) => {
        toast.error(error.message || "Could not open billing");
      },
    }),
  );
};

export const useBillingCheckout = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.billing.checkout.mutationOptions({
      onSuccess: ({ url }) => {
        openBillingUrl(url);
      },
      onError: (error) => {
        toast.error(error.message || "Could not start checkout");
      },
    }),
  );
};
