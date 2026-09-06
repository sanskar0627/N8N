import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import {
  getLatestNodeStatus,
  WORKFLOW_EXECUTION_STARTED_EVENT,
} from "@/features/executions/lib/realtime-status";

interface UseNodeStatusOptions {
  nodeId: string;
  channel: string;
  topic: string;
  refreshToken: () => Promise<Realtime.Subscribe.Token>;
}

export function useNodeStatus({
  nodeId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions) {
  const [status, setStatus] = useState<NodeStatus>("initial");

  const { data } = useInngestSubscription({
    refreshToken,
    enabled: true,
  });

  useEffect(() => {
    const latestStatus = getLatestNodeStatus(data ?? [], {
      nodeId,
      channel,
      topic,
    });

    if (latestStatus) {
      setStatus(latestStatus);
    }
  }, [data, nodeId, channel, topic]);

  useEffect(() => {
    const resetStatus = () => setStatus("initial");
    window.addEventListener(WORKFLOW_EXECUTION_STARTED_EVENT, resetStatus);
    return () =>
      window.removeEventListener(WORKFLOW_EXECUTION_STARTED_EVENT, resetStatus);
  }, []);

  return status;
}
