import { router, protectedProcedure } from "@/server/trpc";
import {
  favoriteRestaurantInputSchema,
  listFavoritesInputSchema,
} from "@/types/favorite";
import {
  checkIsFavorited,
  listFavoriteRestaurants,
  toggleFavorite,
} from "@/server/services/favoriteService";

export const favoriteRouter = router({
  toggle: protectedProcedure
    .input(favoriteRestaurantInputSchema)
    .mutation(({ input, ctx }) =>
      toggleFavorite(ctx.session.user.id, input.restaurantId),
    ),

  isFavorited: protectedProcedure
    .input(favoriteRestaurantInputSchema)
    .query(({ input, ctx }) =>
      checkIsFavorited(ctx.session.user.id, input.restaurantId),
    ),

  list: protectedProcedure
    .input(listFavoritesInputSchema)
    .query(({ input, ctx }) =>
      listFavoriteRestaurants(ctx.session.user.id, input.page),
    ),
});
