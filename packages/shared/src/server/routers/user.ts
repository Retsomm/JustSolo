import { router, protectedProcedure } from "../trpc";
import { updateAvatarInputSchema, updateNameInputSchema } from "../../types/userProfile";
import {
  deleteUserAccount,
  getUserProfile,
  updateUserAvatar,
  updateUserName,
} from "../services/userProfileService";

export const userRouter = router({
  getProfile: protectedProcedure.query(({ ctx }) =>
    getUserProfile(ctx.session.user.id),
  ),

  updateName: protectedProcedure
    .input(updateNameInputSchema)
    .mutation(({ input, ctx }) =>
      updateUserName(ctx.session.user.id, input.name),
    ),

  updateAvatar: protectedProcedure
    .input(updateAvatarInputSchema)
    .mutation(({ input, ctx }) =>
      updateUserAvatar(ctx.session.user.id, input.image),
    ),

  // App 上架要求（Apple/Google 都規定有帳號系統就要能在 App 內自助刪除帳號）。
  // 實際的關聯資料清除＋餐廳聚合分數重算都在 Service/Client 層的 transaction 裡完成，
  // 見 userProfileService.ts/prismaClient.ts 的說明。
  deleteAccount: protectedProcedure.mutation(({ ctx }) =>
    deleteUserAccount(ctx.session.user.id),
  ),
});
