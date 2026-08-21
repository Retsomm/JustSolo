import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@justsolo/shared/src/server/routers/_app";
import { resolveApiBaseUrl } from "./apiBaseUrl";
import { getAuthToken } from "./authToken";
import { notifyUnauthorized } from "./unauthorizedHandler";

const REQUEST_TIMEOUT_MS = 8000;

export const trpc = createTRPCReact<AppRouter>();

export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${resolveApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        fetch: async (url, options) => {
          // 記住「發送這個請求當下」用的是哪個 token，跟 headers() 讀的是同一個
          // 全域記憶體鏡像，兩者幾乎同時求值。收到回應時如果是 401，還要再比對一次
          // 現在的 token 是否還是同一個——如果不是（表示等回應的這段時間，使用者已經
          // 用新帳號登入成功、token 換過了），代表這個 401 只是某個舊 session 的
          // 遲來回應，不能拿來清掉剛登入成功的新 session。
          const tokenForThisRequest = getAuthToken();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            if (response.status === 401 && tokenForThisRequest !== null && tokenForThisRequest === getAuthToken()) {
              notifyUnauthorized();
            }
            return response;
          } finally {
            clearTimeout(timer);
          }
        },
        headers: () => {
          const token = getAuthToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
