import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

export const WORKFLOW_EXECUTION_STARTED_EVENT =
  "m9m:workflow-execution-started";

const NODE_STATUSES = new Set<NodeStatus>(["loading", "success", "error"]);

type RealtimeMessage = {
  kind?: unknown;
  channel?: unknown;
  topic?: unknown;
  createdAt?: unknown;
  data?: unknown;
};

const parseTimestamp = (value: unknown) => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const getLatestNodeStatus = (
  messages: readonly unknown[],
  options: { nodeId: string; channel: string; topic: string },
): NodeStatus | undefined => {
  let latestStatus: NodeStatus | undefined;
  let latestTimestamp = -1;

  for (const value of messages) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const message = value as RealtimeMessage;
    if (
      message.kind !== "data" ||
      message.channel !== options.channel ||
      message.topic !== options.topic ||
      !message.data ||
      typeof message.data !== "object"
    ) {
      continue;
    }

    const data = message.data as Record<string, unknown>;
    if (
      data.nodeId !== options.nodeId ||
      typeof data.status !== "string" ||
      !NODE_STATUSES.has(data.status as NodeStatus)
    ) {
      continue;
    }

    const timestamp = parseTimestamp(message.createdAt);
    if (timestamp >= latestTimestamp) {
      latestTimestamp = timestamp;
      latestStatus = data.status as NodeStatus;
    }
  }

  return latestStatus;
};
