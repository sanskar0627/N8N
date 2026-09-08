import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";
import { FREE_WORKFLOW_LIMIT, PAGINATION } from "@/config/constants";
import {
  collectAiCredentialRefs,
  findInvalidAiCredentialRef,
} from "@/features/credentials/lib/ai-credentials";
import {
  persistNodeSecret,
  readNodeSecret,
} from "@/features/credentials/lib/node-secret";
import {
  AI_NODE_TYPES,
  isAiNodeType,
} from "@/features/executions/components/ai-node/config";
import {
  isWebhookMessageNodeType,
  WEBHOOK_MESSAGE_NODE_TYPES,
} from "@/features/executions/components/webhook-message/config";
import { redactExecutionOutput } from "@/features/executions/lib/redact-execution-output";
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
import { executeWorkflowDirect } from "@/features/executions/lib/direct-executor";
import prisma from "@/lib/db";
import {
  getPolarCustomerState,
  hasActivePolarSubscription,
} from "@/lib/polar-customer";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Shared node/edge schema for reuse across procedures
const nodesSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string().nullish(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.string(), z.any()).optional(),
  }),
);
const edgesSchema = z.array(
  z.object({
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().nullish(),
    targetHandle: z.string().nullish(),
  }),
);

type NodesInput = z.infer<typeof nodesSchema>;
type EdgesInput = z.infer<typeof edgesSchema>;

/**
 * Save workflow nodes and edges to the database.
 * Handles secret preservation for private node types and connection deduplication.
 */
async function saveWorkflowNodes(params: {
  workflowId: string;
  nodes: NodesInput;
  edges: EdgesInput;
}) {
  const { workflowId, nodes, edges } = params;

  // Validate node types before saving
  const validNodeTypes = new Set(Object.values(NodeType));
  for (const node of nodes) {
    if (!node.type || !validNodeTypes.has(node.type as NodeType)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid node type "${node.type}" for node ${node.id}`,
      });
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Fetch existing nodes for secret preservation
    const allExistingNodes = await tx.node.findMany({
      where: { workflowId },
      select: { id: true, type: true, data: true },
    });
    const privateNodeTypes = new Set<NodeType>([
      NodeType.GOOGLE_FORM_TRIGGER,
      NodeType.STRIPE_TRIGGER,
      ...AI_NODE_TYPES,
      ...WEBHOOK_MESSAGE_NODE_TYPES,
    ]);
    const existingPrivateNodes = allExistingNodes.filter(
      (node: { type: string }) => privateNodeTypes.has(node.type as NodeType),
    );

    const extractSecret = (
      nodes: typeof existingPrivateNodes,
      key: string,
    ) =>
      new Map(
        nodes.flatMap((node: { id: string; data: unknown }) => {
          const data =
            node.data &&
            typeof node.data === "object" &&
            !Array.isArray(node.data)
              ? (node.data as Record<string, unknown>)
              : {};
          return typeof data[key] === "string"
            ? [[node.id, data[key] as string] as const]
            : [];
        }),
      );

    const googleFormSecrets = extractSecret(existingPrivateNodes, "secret");
    const stripeWebhookSecrets = extractSecret(existingPrivateNodes, "webhookSecret");
    const aiApiKeys = extractSecret(existingPrivateNodes, "apiKey");
    const webhookUrls = extractSecret(existingPrivateNodes, "webhookUrl");

    // Delete existing nodes and connections (cascade deletes connections)
    await tx.node.deleteMany({ where: { workflowId } });

    // Create nodes
    await tx.node.createMany({
      data: nodes.map((node) => {
        const data = { ...(node.data || {}) };

        if (node.type === NodeType.GOOGLE_FORM_TRIGGER) {
          delete data.secret;
          const existingSecret = googleFormSecrets.get(node.id);
          if (existingSecret) {
            data.secret = persistNodeSecret(existingSecret);
          }
        }

        if (node.type === NodeType.STRIPE_TRIGGER) {
          delete data.webhookSecret;
          const existingSecret = stripeWebhookSecrets.get(node.id);
          if (existingSecret) {
            data.webhookSecret = persistNodeSecret(existingSecret);
          }
        }

        if (typeof node.type === "string" && isAiNodeType(node.type)) {
          delete data.apiKey;
          const hasCredential =
            typeof data.credentialId === "string" &&
            data.credentialId.length > 0;
          const existingApiKey = aiApiKeys.get(node.id);
          if (!hasCredential && existingApiKey) {
            data.apiKey = persistNodeSecret(existingApiKey);
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
            data.webhookUrl = persistNodeSecret(existingWebhookUrl);
          }
        }

        const sanitizedData = JSON.parse(JSON.stringify(data || {}));

        return {
          id: node.id,
          workflowId,
          name: node.type || "unknown",
          type: node.type as NodeType,
          position: { x: node.position.x, y: node.position.y },
          data: sanitizedData,
        };
      }),
    });

    // Create connections (deduplicate to avoid unique constraint violation)
    const edgeKeys = new Set<string>();
    const uniqueEdges = edges.filter((edge) => {
      const key = `${edge.source}:${edge.sourceHandle || "main"}:${edge.target}:${edge.targetHandle || "main"}`;
      if (edgeKeys.has(key)) return false;
      edgeKeys.add(key);
      return true;
    });
    if (uniqueEdges.length > 0) {
      await tx.connection.createMany({
        data: uniqueEdges.map((edge) => ({
          workflowId,
          fromNodeId: edge.source,
          toNodeId: edge.target,
          fromOutput: edge.sourceHandle || "main",
          toInput: edge.targetHandle || "main",
        })),
      });
    }

    // Update workflow's updatedAt timestamp
    await tx.workflow.update({
      where: { id: workflowId },
      data: { updatedAt: new Date() },
    });
  });
}

export const workflowsRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    return prisma.$transaction(async (tx) => {
      const customer = await getPolarCustomerState({
        id: userId,
        email: ctx.auth.user.email,
        name: ctx.auth.user.name,
      });

      if (!hasActivePolarSubscription(customer)) {
        const workflowCount = await tx.workflow.count({
          where: { userId },
        });

        if (workflowCount >= FREE_WORKFLOW_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free plan is limited to ${FREE_WORKFLOW_LIMIT} workflows. Upgrade to create more.`,
          });
        }
      }

      return tx.workflow.create({
        data: {
          name: generateSlug(3),
          userId,
          nodes: {
            create: {
              type: NodeType.INITIAL,
              position: { x: 0, y: 0 },
              name: NodeType.INITIAL,
            },
          },
        },
      });
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
        nodes: nodesSchema,
        edges: edgesSchema,
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

      try {
        await saveWorkflowNodes({ workflowId: id, nodes, edges });
      } catch (error) {
        console.error("[workflows.update] Failed to save workflow:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to save workflow",
        });
      }

      return workflow;
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
        return { secret: readNodeSecret(existingSecret) };
      }

      const secret = randomUUID();
      const storedSecret = persistNodeSecret(secret);
      if (input.rotate) {
        await prisma.node.update({
          where: { id: node.id },
          data: { data: { ...nodeData, secret: storedSecret } },
        });
        return { secret };
      }

      await prisma.$executeRaw`
        UPDATE "Node"
        SET "data" = jsonb_set(
          COALESCE("data", '{}'::jsonb),
          '{secret}',
          ${JSON.stringify(storedSecret)}::jsonb
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

      return { secret: readNodeSecret(updatedData.secret) };
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
            webhookSecret: persistNodeSecret(webhookSecret),
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
    .input(
      z.object({
        id: z.string(),
        nodes: nodesSchema.optional(),
        edges: edgesSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });

      // Auto-save canvas state before executing
      if (input.nodes && input.edges) {
        try {
          await saveWorkflowNodes({
            workflowId: input.id,
            nodes: input.nodes,
            edges: input.edges,
          });
        } catch (saveError) {
          console.error("[workflows.execute] Auto-save failed:", saveError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: saveError instanceof Error ? saveError.message : "Failed to save workflow before execution",
          });
        }
      }

      // Run execution directly; optionally dispatch to Inngest when configured
      const useInngest = Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV);
      if (useInngest) {
        try {
          await sendWorkflowExecution({ workflowId: input.id });
        } catch (inngestError) {
          console.warn("[workflows.execute] Inngest send failed, running directly:", inngestError instanceof Error ? inngestError.message : inngestError);
          await executeWorkflowDirect(input.id);
        }
      } else {
        await executeWorkflowDirect(input.id);
      }

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
  executeNode: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        nodeId: z.string(),
        mockContext: z.record(z.string(), z.any()).optional(),
        nodeType: z.string().optional(),
        nodeData: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await executeNodeForTest({
        workflowId: input.workflowId,
        nodeId: input.nodeId,
        userId: ctx.auth.user.id,
        mockContext: input.mockContext,
        nodeType: input.nodeType,
        nodeData: input.nodeData,
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
        output: redactExecutionOutput(result.output),
      };
    }),
});
