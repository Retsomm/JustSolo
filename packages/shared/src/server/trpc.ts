import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Session } from "next-auth";

export type Context = {
  session: Session | null;
  // 只有手機版透過 mobileSessionService 簽發/驗證的 token 才有這個值，用來給
  // auth.signOut 撤銷對應的 MobileSession 紀錄；網頁版走 next-auth cookie session
  // 時固定是 null。
  mobileSessionId: string | null;
};

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session, mobileSessionId: ctx.mobileSessionId } });
});
