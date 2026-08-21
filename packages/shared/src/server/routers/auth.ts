import { router, publicProcedure } from "../trpc";
import { signInWithGoogleInputSchema } from "../../types/auth";
import { signInWithGoogleIdToken } from "../services/mobileSessionService";

// public procedure：這個 procedure 的目的就是「還沒登入時換取登入」，
// 不能要求已登入（跟 favorite/soloSeatReport/user 底下全部是 protectedProcedure 不同）。
export const authRouter = router({
  signInWithGoogle: publicProcedure
    .input(signInWithGoogleInputSchema)
    .mutation(({ input }) => signInWithGoogleIdToken(input.idToken)),
});
