export type NodeRealtimeStatus = "loading" | "success" | "error";

export type NodeStatusEvent = {
  nodeId: string;
  status: NodeRealtimeStatus;
  executionId?: string;
};
