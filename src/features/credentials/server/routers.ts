import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { CREDENTIAL_TYPES } from "@/features/credentials/config";
import {
  createCredentialSchema,
  updateCredentialSchema,
} from "@/features/credentials/schema";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { storeCredentialValue } from "../lib/credential-value";

const credentialPublicSelect = {
  id: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const credentialsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCredentialSchema)
    .mutation(({ ctx, input }) =>
      prisma.credential.create({
        data: {
          name: input.name,
          type: input.type,
          value: storeCredentialValue(input.value),
          userId: ctx.auth.user.id,
        },
        select: credentialPublicSelect,
      }),
    ),

  update: protectedProcedure
    .input(updateCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.credential.findFirst({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      return prisma.credential.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          ...(input.value ? { value: storeCredentialValue(input.value) } : {}),
        },
        select: credentialPublicSelect,
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const credential = await prisma.credential.findFirst({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: credentialPublicSelect,
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      const usageCount = await prisma.node.count({
        where: {
          workflow: { userId: ctx.auth.user.id },
          data: { path: ["credentialId"], equals: input.id },
        },
      });

      if (usageCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Credential is used by ${usageCount} workflow node${usageCount === 1 ? "" : "s"}`,
        });
      }

      await prisma.credential.delete({ where: { id: credential.id } });
      return credential;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const credential = await prisma.credential.findFirst({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: credentialPublicSelect,
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      return credential;
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.auth.user.id,
        name: {
          contains: input.search,
          mode: "insensitive" as const,
        },
      };
      const [items, totalCount] = await Promise.all([
        prisma.credential.findMany({
          where,
          select: credentialPublicSelect,
          orderBy: { updatedAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        prisma.credential.count({ where }),
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

  getByType: protectedProcedure
    .input(z.object({ type: z.enum(CREDENTIAL_TYPES) }))
    .query(({ ctx, input }) =>
      prisma.credential.findMany({
        where: { userId: ctx.auth.user.id, type: input.type },
        select: credentialPublicSelect,
        orderBy: { name: "asc" },
      }),
    ),
});
