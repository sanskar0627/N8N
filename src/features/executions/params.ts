import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { PAGINATION } from "@/config/constants";
import { ExecutionStatus } from "@/generated/prisma/enums";

export const EXECUTION_STATUS_FILTERS = [
  ExecutionStatus.RUNNING,
  ExecutionStatus.SUCCESS,
  ExecutionStatus.FAILED,
] as const;

export const executionsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  workflowId: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  status: parseAsStringLiteral(EXECUTION_STATUS_FILTERS).withOptions({
    clearOnDefault: true,
  }),
};
