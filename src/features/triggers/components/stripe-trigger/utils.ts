import { createHash } from "node:crypto";
import type Stripe from "stripe";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const firstNumber = (
  object: Record<string, unknown>,
  keys: string[],
): number | null => {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
};

const getCustomerId = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  const customer = asRecord(value);
  return typeof customer.id === "string" ? customer.id : null;
};

export const buildStripeInitialData = (event: Stripe.Event) => {
  const object = asRecord(event.data.object);

  return {
    stripe: {
      eventId: event.id,
      eventType: event.type,
      timestamp: event.created,
      livemode: event.livemode,
      objectId: typeof object.id === "string" ? object.id : null,
      amount: firstNumber(object, [
        "amount",
        "amount_total",
        "amount_received",
        "amount_paid",
      ]),
      currency: typeof object.currency === "string" ? object.currency : null,
      customerId: getCustomerId(object.customer),
      raw: object,
    },
  };
};

export const getStripeEventId = (
  workflowId: string,
  nodeId: string,
  stripeEventId: string,
) => {
  const digest = createHash("sha256")
    .update(`${workflowId}:${nodeId}:${stripeEventId}`)
    .digest("hex");
  return `stripe-${digest}`;
};

export const shouldProcessStripeEvent = (
  eventType: string,
  allowedEventTypes: string[],
) => allowedEventTypes.length === 0 || allowedEventTypes.includes(eventType);
