import { TRPCError } from "@trpc/server";
import { POLAR_PRO_PRODUCT_ID, polarClient } from "@/lib/polar";
import { getPolarCustomerState, hasActivePolarSubscription } from "@/lib/polar-customer";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const requirePolarCustomer = async (user: {
  id: string;
  email: string;
  name?: string | null;
}) => {
  const customer = await getPolarCustomerState(user);

  if (!customer) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Billing is unavailable right now. Try again in a moment.",
    });
  }

  return customer;
};

export const billingRouter = createTRPCRouter({
  portal: protectedProcedure.mutation(async ({ ctx }) => {
    const customer = await requirePolarCustomer(ctx.auth.user);
    const session = await polarClient.customerSessions.create({
      customerId: customer.id,
      returnUrl: process.env.BETTER_AUTH_URL || undefined,
    });

    return { url: session.customerPortalUrl };
  }),

  customerState: protectedProcedure.query(async ({ ctx }) => {
    const state = await getPolarCustomerState({
      id: ctx.auth.user.id,
      email: ctx.auth.user.email,
      name: ctx.auth.user.name,
    });
    return state ?? null;
  }),

  checkout: protectedProcedure.mutation(async ({ ctx }) => {
    const customer = await requirePolarCustomer(ctx.auth.user);

    if (hasActivePolarSubscription(customer)) {
      const session = await polarClient.customerSessions.create({
        customerId: customer.id,
        returnUrl: process.env.BETTER_AUTH_URL || undefined,
      });
      return { url: session.customerPortalUrl };
    }

    const checkout = await polarClient.checkouts.create({
      products: [POLAR_PRO_PRODUCT_ID],
      customerId: customer.id,
      customerEmail: ctx.auth.user.email,
      successUrl: process.env.POLAR_SUCCESS_URL || undefined,
      returnUrl: process.env.BETTER_AUTH_URL || undefined,
    });

    return { url: checkout.url };
  }),
});
