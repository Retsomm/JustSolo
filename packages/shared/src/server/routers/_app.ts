import { router } from "../trpc";
import { restaurantRouter } from "./restaurant";
import { categoryRouter } from "./category";
import { districtRouter } from "./district";
import { soloSeatReportRouter } from "./soloSeatReport";
import { favoriteRouter } from "./favorite";
import { userRouter } from "./user";

export const appRouter = router({
  restaurant: restaurantRouter,
  category: categoryRouter,
  district: districtRouter,
  soloSeatReport: soloSeatReportRouter,
  favorite: favoriteRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
