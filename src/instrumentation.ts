import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Raise default max listeners to prevent warnings in dev
    // (Turbopack hot reload attaches extra listeners to ServerResponse objects)
    const { EventEmitter } = await import("node:events");
    EventEmitter.defaultMaxListeners = 20;
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
