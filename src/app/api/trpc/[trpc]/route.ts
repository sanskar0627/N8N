import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "../../../../trpc/init";
import { appRouter } from "../../../../trpc/routers/_app";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = (req: Request) => {
  console.log(`[trpc] ${req.method} ${new URL(req.url).pathname}`);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
};

export { handler as GET, handler as POST };
