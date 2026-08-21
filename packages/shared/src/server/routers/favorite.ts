import { router, protectedProcedure } from "../trpc";
import {
  favoriteRestaurantInputSchema,
  listFavoritesInputSchema,
  toggleFavoriteInputSchema,
} from "../../types/favorite";
import {
  checkIsFavorited,
  listFavoriteRestaurants,
  toggleFavorite,
} from "../services/favoriteService";

export const favoriteRouter = router({
  toggle: protectedProcedure
    .input(toggleFavoriteInputSchema)
    .mutation(({ input, ctx }) =>
      toggleFavorite(ctx.session.user.id, input.restaurantId, input.isFavorited),
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
