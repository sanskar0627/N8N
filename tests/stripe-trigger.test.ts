import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { resolveTemplate } from "../src/features/executions/lib/template";
import {
  stripeEventTypesSchema,
  stripeWebhookSecretSchema,
} from "../src/features/triggers/components/stripe-trigger/schema";
import {
  buildStripeInitialData,
  getStripeEventId,
  shouldProcessStripeEvent,
} from "../src/features/triggers/components/stripe-trigger/utils";
import { workflowNodeStatusChannelName } from "../src/inngest/channels/workflow-node-status";

const stripe = new Stripe("sk_test_m9m_tests");

const stripeEvent = {
  id: "evt_test_123",
  object: "event",
  api_version: "2025-12-15.clover",
  created: 1_787_987_600,
  data: {
    object: {
      id: "pi_123",
      object: "payment_intent",
      amount: 4200,
      currency: "usd",
      customer: "cus_123",
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: null,
  type: "payment_intent.succeeded",
} as unknown as Stripe.Event;

test("validates Stripe webhook configuration", () => {
  assert.equal(
    stripeWebhookSecretSchema.safeParse("whsec_1234567890abcdef").success,
    true,
  );
  assert.equal(
    stripeWebhookSecretSchema.safeParse("sk_test_wrong").success,
    false,
  );
  assert.deepEqual(
    stripeEventTypesSchema.parse([
      "invoice.paid",
      "payment_intent.succeeded",
      "invoice.paid",
    ]),
    ["invoice.paid", "payment_intent.succeeded"],
  );
});

test("normalizes Stripe events for workflow templates", () => {
  const context = buildStripeInitialData(stripeEvent);

  assert.deepEqual(context.stripe, {
    eventId: "evt_test_123",
    eventType: "payment_intent.succeeded",
    timestamp: 1_787_987_600,
    livemode: false,
    objectId: "pi_123",
    amount: 4200,
    currency: "usd",
    customerId: "cus_123",
    raw: stripeEvent.data.object,
  });
  assert.equal(
    resolveTemplate("{{stripe.amount}} {{stripe.currency}}", context),
    "4200 usd",
  );
});

test("filters Stripe event types", () => {
  assert.equal(shouldProcessStripeEvent("invoice.paid", []), true);
  assert.equal(
    shouldProcessStripeEvent("invoice.paid", ["invoice.paid"]),
    true,
  );
  assert.equal(
    shouldProcessStripeEvent("customer.created", ["invoice.paid"]),
    false,
  );
});

test("verifies Stripe signatures against the raw payload", () => {
  const payload = JSON.stringify(stripeEvent);
  const secret = "whsec_1234567890abcdef";
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });

  assert.equal(
    stripe.webhooks.constructEvent(payload, signature, secret).id,
    stripeEvent.id,
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(`${payload} `, signature, secret),
  );
});

test("scopes event ids and realtime channels", () => {
  assert.equal(
    getStripeEventId("workflow-1", "node-1", "event-1"),
    getStripeEventId("workflow-1", "node-1", "event-1"),
  );
  assert.notEqual(
    getStripeEventId("workflow-1", "node-1", "event-1"),
    getStripeEventId("workflow-1", "node-2", "event-1"),
  );
  assert.equal(
    workflowNodeStatusChannelName("workflow-1"),
    "workflow:workflow-1:node-status",
  );
});
