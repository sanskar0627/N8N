import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import {
  collectAiCredentialRefs,
  findInvalidAiCredentialRef,
} from "@/features/credentials/lib/ai-credentials";
import {
  AI_NODE_TYPES,
  isAiNodeType,
} from "@/features/executions/components/ai-node/config";
import {
  isWebhookMessageNodeType,
  WEBHOOK_MESSAGE_NODE_TYPES,
} from "@/features/executions/components/webhook-message/config";
import { executeNodeForTest } from "@/features/executions/lib/test-executor";
import {
  findDuplicateVariableNames,
  variableNameSchema,
} from "@/features/executions/lib/variable-name";
import {
  stripeEventTypesSchema,
  stripeWebhookSecretSchema,
} from "@/features/triggers/components/stripe-trigger/schema";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";

export const workflowsRouter = createTRPCRouter({
  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        nodes: {
          create: {
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;
      const variableNames = nodes.flatMap((node) => {
        const variableName = node.data?.variableName;
        return typeof variableName === "string" ? [variableName] : [];
      });

      for (const variableName of variableNames) {
        const result = variableNameSchema.safeParse(variableName);
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error.issues[0]?.message ?? "Invalid variable name",
          });
        }
      }

      const duplicateVariableNames = findDuplicateVariableNames(nodes);
      if (duplicateVariableNames.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Variable names must be unique. Duplicates: ${duplicateVariableNames.join(", ")}`,
        });
      }

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      const aiCredentialRefs = collectAiCredentialRefs(nodes);
      if (aiCredentialRefs.length > 0) {
        const credentials = await prisma.credential.findMany({
          where: {
            id: {
              in: [...new Set(aiCredentialRefs.map((ref) => ref.credentialId))],
            },
            userId: ctx.auth.user.id,
          },
          select: { id: true, type: true },
        });
        const invalidCredential = findInvalidAiCredentialRef(
          aiCredentialRefs,
          credentials,
        );
        if (invalidCredential) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: invalidCredential,
          });
        }
      }

      // Transaction to ensure consistency
      return await prisma.$transaction(async (tx) => {
        const existingPrivateNodes = await tx.node.findMany({
          where: {
            workflowId: id,
            type: {
              in: [
                NodeType.GOOGLE_FORM_TRIGGER,
                NodeType.STRIPE_TRIGGER,
                ...AI_NODE_TYPES,
                ...WEBHOOK_MESSAGE_NODE_TYPES,
              ],
            },
          },
          select: { id: true, data: true },
        });
        const googleFormSecrets = new Map(
          existingPrivateNodes.flatMap(
            (node: { id: string; data: unknown }) => {
              const data =
                node.data &&
                typeof node.data === "object" &&
                !Array.isArray(node.data)
                  ? (node.data as Record<string, unknown>)
                  : {};
              return typeof data.secret === "string"
                ? [[node.id, data.secret] as const]
                : [];
            },
          ),
        );
        const stripeWebhookSecrets = new Map(
          existingPrivateNodes.flatMap(
            (node: { id: string; data: unknown }) => {
              const data =
                node.data &&
                typeof node.data === "object" &&
                !Array.isArray(node.data)
                  ? (node.data as Record<string, unknown>)
                  : {};
              return typeof data.webhookSecret === "string"
                ? [[node.id, data.webhookSecret] as const]
                : [];
            },
          ),
        );
        const aiApiKeys = new Map(
          existingPrivateNodes.flatMap(
            (node: { id: string; data: unknown }) => {
              const data =
                node.data &&
                typeof node.data === "object" &&
                !Array.isArray(node.data)
                  ? (node.data as Record<string, unknown>)
                  : {};
              return typeof data.apiKey === "string"
                ? [[node.id, data.apiKey] as const]
                : [];
            },
          ),
        );
        const webhookUrls = new Map(
          existingPrivateNodes.flatMap(
            (node: { id: string; data: unknown }) => {
              const data =
                node.data &&
                typeof node.data === "object" &&
                !Array.isArray(node.data)
                  ? (node.data as Record<string, unknown>)
                  : {};
              return typeof data.webhookUrl === "string"
                ? [[node.id, data.webhookUrl] as const]
                : [];
            },
          ),
        );

        // Delete existing nodes and connections (cascade deletes connections)
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        // Create nodes
        await tx.node.createMany({
          data: nodes.map((node) => {
            const data = { ...(node.data || {}) };

            if (node.type === NodeType.GOOGLE_FORM_TRIGGER) {
              delete data.secret;
              const existingSecret = googleFormSecrets.get(node.id);
              if (existingSecret) {
                data.secret = existingSecret;
              }
            }

            if (node.type === NodeType.STRIPE_TRIGGER) {
              delete data.webhookSecret;
              const existingSecret = stripeWebhookSecrets.get(node.id);
              if (existingSecret) {
                data.webhookSecret = existingSecret;
              }
            }

            if (typeof node.type === "string" && isAiNodeType(node.type)) {
              delete data.apiKey;
              const hasCredential =
                typeof data.credentialId === "string" &&
                data.credentialId.length > 0;
              const existingApiKey = aiApiKeys.get(node.id);
              if (!hasCredential && existingApiKey) {
                data.apiKey = existingApiKey;
              }
            }

            if (
              typeof node.type === "string" &&
              isWebhookMessageNodeType(node.type)
            ) {
              delete data.webhookUrl;
              const hasCredential =
                typeof data.credentialId === "string" &&
                data.credentialId.length > 0;
              const existingWebhookUrl = webhookUrls.get(node.id);
              if (!hasCredential && existingWebhookUrl) {
                data.webhookUrl = existingWebhookUrl;
              }
            }

            return {
              id: node.id,
              workflowId: id,
              name: node.type || "unknown",
              type: node.type as NodeType,
              position: node.position,
              data,
            };
          }),
        });

        // Create connections
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        // Update workflow's updatedAt timestamp
        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return workflow;
      });
    }),
  generateGoogleFormSecret: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        nodeId: z.string(),
        rotate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const node = await prisma.node.findFirst({
        where: {
          id: input.nodeId,
          workflowId: input.workflowId,
          type: NodeType.GOOGLE_FORM_TRIGGER,
          workflow: { userId: ctx.auth.user.id },
        },
      });

      if (!node) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Save the Google Form Trigger before configuring it",
        });
      }

      const nodeData =
        node.data && typeof node.data === "object" && !Array.isArray(node.data)
          ? (node.data as Record<string, unknown>)
          : {};
      const existingSecret = nodeData.secret;

      if (typeof existingSecret === "string" && !input.rotate) {
        return { secret: existingSecret };
      }

      const secret = randomUUID();
      if (input.rotate) {
        await prisma.node.update({
          where: { id: node.id },
          data: { data: { ...nodeData, secret } },
        });
        return { secret };
      }

      await prisma.$executeRaw`
        UPDATE "Node"
        SET "data" = jsonb_set(
          COALESCE("data", '{}'::jsonb),
          '{secret}',
          ${JSON.stringify(secret)}::jsonb
        )
        WHERE "id" = ${node.id}
          AND (
            "data"->>'secret' IS NULL
            OR "data"->>'secret' = ''
          )
      `;

      const updatedNode = await prisma.node.findUnique({
        where: { id: node.id },
        select: { data: true },
      });
      const updatedData =
        updatedNode?.data &&
        typeof updatedNode.data === "object" &&
        !Array.isArray(updatedNode.data)
          ? (updatedNode.data as Record<string, unknown>)
          : {};

      if (typeof updatedData.secret !== "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate webhook secret",
        });
      }

      return { secret: updatedData.secret };
    }),
  getStripeWebhookConfig: protectedProcedure
    .input(z.object({ workflowId: z.string(), nodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const node = await prisma.node.findFirst({
        where: {
          id: input.nodeId,
          workflowId: input.workflowId,
          type: NodeType.STRIPE_TRIGGER,
          workflow: { userId: ctx.auth.user.id },
        },
        select: { data: true },
      });

      if (!node) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Save the Stripe Trigger before configuring it",
        });
      }

      const data =
        node.data && typeof node.data === "object" && !Array.isArray(node.data)
          ? (node.data as Record<string, unknown>)
          : {};

      return {
        configured: typeof data.webhookSecret === "string",
        allowedEventTypes:
          stripeEventTypesSchema.safeParse(data.allowedEventTypes).data ?? [],
      };
    }),
  saveStripeWebhookConfig: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        nodeId: z.string(),
        webhookSecret: stripeWebhookSecretSchema.optional(),
        allowedEventTypes: stripeEventTypesSchema.default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const node = await prisma.node.findFirst({
        where: {
          id: input.nodeId,
          workflowId: input.workflowId,
          type: NodeType.STRIPE_TRIGGER,
          workflow: { userId: ctx.auth.user.id },
        },
      });

      if (!node) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Save the Stripe Trigger before configuring it",
        });
      }

      const data =
        node.data && typeof node.data === "object" && !Array.isArray(node.data)
          ? (node.data as Record<string, unknown>)
          : {};
      const webhookSecret = input.webhookSecret ?? data.webhookSecret;

      if (typeof webhookSecret !== "string") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe webhook signing secret is required",
        });
      }

      await prisma.node.update({
        where: { id: node.id },
        data: {
          data: {
            ...data,
            webhookSecret,
            allowedEventTypes: input.allowedEventTypes,
          },
        },
      });

      return {
        configured: true,
        allowedEventTypes: input.allowedEventTypes,
      };
    }),
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });

      await sendWorkflowExecution({ workflowId: input.id });

      return workflow;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connection: true },
      });

      // Transform server nodes to react-flow compatible nodes
      const nodes: Node[] = workflow.nodes.map(
        (node: {
          id: string;
          type: string;
          position: unknown;
          data: unknown;
        }) => {
          const data =
            node.data &&
            typeof node.data === "object" &&
            !Array.isArray(node.data)
              ? { ...(node.data as Record<string, unknown>) }
              : {};

          if (node.type === NodeType.GOOGLE_FORM_TRIGGER) {
            delete data.secret;
          }

          if (node.type === NodeType.STRIPE_TRIGGER) {
            delete data.webhookSecret;
          }

          if (isAiNodeType(node.type)) {
            delete data.apiKey;
          }

          if (isWebhookMessageNodeType(node.type)) {
            delete data.webhookUrl;
          }

          return {
            id: node.id,
            type: node.type,
            position: node.position as { x: number; y: number },
            data,
          };
        },
      );

      // Transform server connections to react-flow compatible edges
      const edges: Edge[] = workflow.connection.map(
        (connection: {
          id: string;
          fromNodeId: string;
          toNodeId: string;
          fromOutput: string;
          toInput: string;
        }) => ({
          id: connection.id,
          source: connection.fromNodeId,
          target: connection.toNodeId,
          sourceHandle: connection.fromOutput,
          targetHandle: connection.toInput,
        }),
      );

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),
  executeNode: premiumProcedure
    .input(
      z.object({
        workflowId: z.string(),
        nodeId: z.string(),
        mockContext: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await executeNodeForTest({
        workflowId: input.workflowId,
        nodeId: input.nodeId,
        userId: ctx.auth.user.id,
        mockContext: input.mockContext,
      });

      if (!result.success) {
        let code:
          | "NOT_FOUND"
          | "FORBIDDEN"
          | "BAD_REQUEST"
          | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";

        if (result.error === "Node not found") {
          code = "NOT_FOUND";
        } else if (result.error === "Unauthorized") {
          code = "FORBIDDEN";
        } else if (
          result.error === "Trigger nodes cannot be tested individually"
        ) {
          code = "BAD_REQUEST";
        }

        throw new TRPCError({
          code,
          message: result.error || "Node execution failed",
        });
      }

      return {
        success: true,
        nodeId: input.nodeId,
        output: result.output,
      };
    }),
});
