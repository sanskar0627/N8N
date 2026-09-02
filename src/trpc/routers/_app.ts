import { credentialsRouter } from "@/features/credentials/server/routers";
import { workflowsRouter } from "@/features/workflows/server/routers";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  credentials: credentialsRouter,
  workflows: workflowsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
