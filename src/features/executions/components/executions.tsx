"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExecutionStatus } from "@/generated/prisma/enums";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { useSuspenseExecutions } from "../hooks/use-executions";
import { useExecutionsParams } from "../hooks/use-executions-params";
import {
  formatExecutionDuration,
  formatExecutionStatus,
} from "../lib/format-execution";
import { EXECUTION_STATUS_FILTERS } from "../params";

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2Icon className="size-4 text-emerald-600" />;
    case "FAILED":
      return <XCircleIcon className="size-4 text-red-600" />;
    case "RUNNING":
      return <Loader2Icon className="size-4 animate-spin text-sky-600" />;
    default:
      return <ClockIcon className="size-4 text-muted-foreground" />;
  }
};

export const ExecutionsSearch = () => {
  const [params, setParams] = useExecutionsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Select
        value={params.status ?? "all"}
        onValueChange={(value) =>
          setParams({
            ...params,
            page: 1,
            status:
              value === "all"
                ? null
                : (value as (typeof EXECUTION_STATUS_FILTERS)[number]),
          })
        }
      >
        <SelectTrigger className="w-full bg-background sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {EXECUTION_STATUS_FILTERS.map((status) => (
            <SelectItem key={status} value={status}>
              {formatExecutionStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <EntitySearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="Search workflows"
      />
    </div>
  );
};

export const ExecutionsList = () => {
  const executions = useSuspenseExecutions();

  return (
    <EntityList
      items={executions.data.items}
      getKey={(execution) => execution.id}
      renderItem={(execution) => <ExecutionItem data={execution} />}
      emptyView={<ExecutionsEmpty />}
    />
  );
};

export const ExecutionsHeader = () => (
  <EntityHeader
    title="Executions"
    description="Review recent workflow runs, errors, and outputs"
  />
);

export const ExecutionsPagination = () => {
  const executions = useSuspenseExecutions();
  const [params, setParams] = useExecutionsParams();

  return (
    <EntityPagination
      disabled={executions.isFetching}
      totalPages={executions.data.totalPages}
      page={executions.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const ExecutionsLoading = () => (
  <LoadingView message="Loading executions..." />
);

export const ExecutionsError = () => (
  <ErrorView message="Could not load executions" />
);

export const ExecutionsEmpty = () => {
  const router = useRouter();

  return (
    <EmptyView
      onNew={() => router.push("/workflows")}
      title="No executions yet"
      actionLabel="Open workflows"
      message="Run a workflow from the editor to see status, duration, and output here."
    />
  );
};

type ExecutionListItem = {
  id: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  workflow: {
    id: string;
    name: string;
  };
};

const ExecutionItem = ({ data }: { data: ExecutionListItem }) => {
  const duration = formatExecutionDuration(data.startedAt, data.completedAt);
  const subtitle = [
    data.workflow.name,
    `Started ${formatDistanceToNow(data.startedAt, { addSuffix: true })}`,
    duration ? `Took ${duration}` : null,
    data.status === "FAILED" && data.error ? data.error : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <EntityItem
      href={`/executions/${data.id}`}
      title={formatExecutionStatus(data.status)}
      subtitle={subtitle}
      image={getStatusIcon(data.status)}
    />
  );
};

export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <EntityContainer
    header={<ExecutionsHeader />}
    search={<ExecutionsSearch />}
    pagination={<ExecutionsPagination />}
  >
    {children}
  </EntityContainer>
);
