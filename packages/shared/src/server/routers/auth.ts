import { router, publicProcedure, protectedProcedure } from "../trpc";
import { signInWithGoogleInputSchema } from "../../types/auth";
import { signInWithGoogleIdToken, revokeMobileSession } from "../services/mobileSessionService";

// public procedure：這個 procedure 的目的就是「還沒登入時換取登入」，
// 不能要求已登入（跟 favorite/soloSeatReport/user 底下全部是 protectedProcedure 不同）。
export const authRouter = router({
  signInWithGoogle: publicProcedure
    .input(signInWithGoogleInputSchema)
    .mutation(({ input }) => signInWithGoogleIdToken(input.idToken)),

  // 手機版登出時呼叫，撤銷這次請求帶的 mobileSessionId，讓裝置上的 token
  // 立即失效（不用等 30 天自然過期）。網頁版走 next-auth session 時
  // ctx.mobileSessionId 固定是 null，revokeMobileSession 會直接 no-op。
  signOut: protectedProcedure.mutation(({ ctx }) => revokeMobileSession(ctx.mobileSessionId)),
});
