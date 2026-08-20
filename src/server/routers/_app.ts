import { router } from "@/server/trpc";
import { restaurantRouter } from "@/server/routers/restaurant";
import { categoryRouter } from "@/server/routers/category";
import { districtRouter } from "@/server/routers/district";
import { soloSeatReportRouter } from "@/server/routers/soloSeatReport";
import { favoriteRouter } from "@/server/routers/favorite";
import { userRouter } from "@/server/routers/user";

export const appRouter = router({
  restaurant: restaurantRouter,
  category: categoryRouter,
  district: districtRouter,
  soloSeatReport: soloSeatReportRouter,
  favorite: favoriteRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
