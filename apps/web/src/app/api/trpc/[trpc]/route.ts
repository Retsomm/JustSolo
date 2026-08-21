import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@justsolo/shared/src/server/routers/_app";
import { auth } from "@/auth";
import type { Context } from "@justsolo/shared/src/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => ({ session: await auth() }),
  });

export { handler as GET, handler as POST };
