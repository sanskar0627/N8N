import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { redactExecutionOutput } from "@/features/executions/lib/redact-execution-output";
import { EXECUTION_STATUS_FILTERS } from "@/features/executions/params";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const executionListSelect = {
  id: true,
  status: true,
  startedAt: true,
  completedAt: true,
  error: true,
  workflowId: true,
  workflow: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const executionsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const execution = await prisma.execution.findFirst({
        where: {
          id: input.id,
          workflow: { userId: ctx.auth.user.id },
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!execution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Execution not found",
        });
      }

      return {
        ...execution,
        output: redactExecutionOutput(execution.output),
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
        workflowId: z.string().min(1).optional(),
        status: z.enum(EXECUTION_STATUS_FILTERS).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        status: input.status ?? undefined,
        workflow: {
          userId: ctx.auth.user.id,
          ...(input.workflowId ? { id: input.workflowId } : {}),
          ...(input.search
            ? {
                name: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
      };

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          where,
          select: executionListSelect,
          orderBy: { startedAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.execution.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / input.pageSize);

      return {
        items,
        page: input.page,
        pageSize: input.pageSize,
        totalCount,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1,
      };
    }),
});
