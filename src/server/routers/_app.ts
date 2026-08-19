import { router } from "@/server/trpc";
import { restaurantRouter } from "@/server/routers/restaurant";
import { categoryRouter } from "@/server/routers/category";
import { districtRouter } from "@/server/routers/district";

export const appRouter = router({
  restaurant: restaurantRouter,
  category: categoryRouter,
  district: districtRouter,
});

export type AppRouter = typeof appRouter;
