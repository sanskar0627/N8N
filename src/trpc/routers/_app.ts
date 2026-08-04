import { inngest } from '@/inngest/client';
import { baseProcedure, createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';

export const appRouter = createTRPCRouter({
  testAi: baseProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",
    });

    return { success: true, message: "Job queued" }
  }),
  testAnthropic: baseProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/anthropic",
    });

    return { success: true, message: "Anthropic job queued" }
  }),
  testOpenRouter: baseProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/openrouter",
    });

    return { success: true, message: "OpenRouter job queued" }
  }),
  getWorkflows: protectedProcedure.query(({ ctx }) => {
    return prisma.workflow.findMany();
  }),
  createWorkflow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "test/hello.world",
      data: {
        email: "sanskar@mail.com",
      },
    });

    return { success: true, message: "Job queued" };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
