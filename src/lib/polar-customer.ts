import { cache } from "react";
import { polarClient } from "@/lib/polar";

type PolarUser = {
  id: string;
  email: string;
  name?: string | null;
};

const isPolarNotFound = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ResourceNotFound") ||
    message.includes('"detail":"Not found"')
  );
};

const isPolarEmailTaken = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("already exists") ||
    message.includes("PolarRequestValidationError")
  );
};

const findCustomerByEmail = async (email: string) => {
  const page = await polarClient.customers.list({
    email,
    limit: 1,
  });
  const items =
    "result" in page && page.result?.items ? page.result.items : [];

  return items[0] ?? null;
};

const getStateByCustomerId = (customerId: string) =>
  polarClient.customers.getState({ id: customerId });

const linkAndGetState = async (customerId: string, userId: string) => {
  try {
    await polarClient.customers.update({
      id: customerId,
      customerUpdate: { externalId: userId },
    });
    return await polarClient.customers.getStateExternal({
      externalId: userId,
    });
  } catch (error) {
    console.warn("[polar] customer link failed", error);
    return getStateByCustomerId(customerId);
  }
};

const adoptExistingCustomer = async (user: PolarUser) => {
  const existing = await findCustomerByEmail(user.email);
  if (!existing) return null;

  if (!existing.externalId || existing.externalId === user.id) {
    return linkAndGetState(existing.id, user.id);
  }

  return getStateByCustomerId(existing.id);
};

export async function getPolarCustomerState(user: PolarUser) {
  try {
    return await polarClient.customers.getStateExternal({
      externalId: user.id,
    });
  } catch (error) {
    if (!isPolarNotFound(error)) {
      console.warn("[polar] customer state failed", error);
      return null;
    }
  }

  try {
    await polarClient.customers.create({
      email: user.email,
      name: user.name || user.email,
      externalId: user.id,
    });

    return await polarClient.customers.getStateExternal({
      externalId: user.id,
    });
  } catch (error) {
    if (!isPolarEmailTaken(error)) {
      console.warn("[polar] customer create failed", error);
      return null;
    }
  }

  try {
    return await adoptExistingCustomer(user);
  } catch (error) {
    console.warn("[polar] customer adopt failed", error);
    return null;
  }
}

export const ensurePolarCustomer = cache(async (user: PolarUser) => {
  return getPolarCustomerState(user);
});

export const hasActivePolarSubscription = (
  customer: Awaited<ReturnType<typeof getPolarCustomerState>>,
) => Boolean(customer?.activeSubscriptions?.length);
