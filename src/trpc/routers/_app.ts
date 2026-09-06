import { credentialsRouter } from "@/features/credentials/server/routers";
import { executionsRouter } from "@/features/executions/server/routers";
import { billingRouter } from "@/features/subscriptions/server/routers";
import { workflowsRouter } from "@/features/workflows/server/routers";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  billing: billingRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
  workflows: workflowsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
