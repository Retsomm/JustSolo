import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@justsolo/shared/src/server/routers/_app";
import { verifyMobileSessionToken } from "@justsolo/shared/src/server/services/mobileSessionService";
import { auth } from "@/auth";
import type { Context } from "@justsolo/shared/src/server/trpc";

// 手機版沒有瀏覽器 cookie jar 可以共用網頁版 next-auth 的 session cookie，改成帶
// Authorization: Bearer <mobileSessionService 簽發的 token>。這裡優先檢查這個
// header，驗證成功就直接組出 Session 形狀給 protectedProcedure 用（它們都只依賴
// ctx.session.user.id），並把驗證結果附的 sessionId 一起帶出去給 auth.signOut
// 撤銷用；沒有這個 header（或驗證失敗）就照舊落回網頁版的 cookie-based auth()，
// mobileSessionId 固定是 null，行為完全不變。
const resolveContext = async (req: Request): Promise<Context> => {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const verified = await verifyMobileSessionToken(authHeader.slice("Bearer ".length));
    if (verified) {
      return {
        session: {
          user: { id: verified.userId },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        mobileSessionId: verified.sessionId,
      };
    }
  }
  return { session: await auth(), mobileSessionId: null };
};

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req }) => resolveContext(req),
  });

export { handler as GET, handler as POST };
