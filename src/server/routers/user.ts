import { router, protectedProcedure } from "@/server/trpc";
import { updateAvatarInputSchema, updateNameInputSchema } from "@/types/userProfile";
import {
  getUserProfile,
  updateUserAvatar,
  updateUserName,
} from "@/server/services/userProfileService";

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
});
