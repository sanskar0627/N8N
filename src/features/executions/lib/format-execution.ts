import type { ExecutionStatus } from "@/generated/prisma/enums";

export const formatExecutionStatus = (status: ExecutionStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const toTimestamp = (value: Date | string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const formatExecutionDuration = (
  startedAt: Date | string,
  completedAt?: Date | string | null,
) => {
  if (!completedAt) {
    return null;
  }

  const started = toTimestamp(startedAt);
  const completed = toTimestamp(completedAt);
  if (started === null || completed === null || completed < started) {
    return null;
  }

  const milliseconds = completed - started;
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};
