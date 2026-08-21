import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@justsolo/shared/src/server/routers/_app";
import { resolveApiBaseUrl } from "./apiBaseUrl";

const REQUEST_TIMEOUT_MS = 8000;

export const trpc = createTRPCReact<AppRouter>();

export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${resolveApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        fetch: (url, options) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          return fetch(url, { ...options, signal: controller.signal }).finally(() =>
            clearTimeout(timer),
          );
        },
      }),
    ],
  });
