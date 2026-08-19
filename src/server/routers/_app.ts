import { router } from "@/server/trpc";
import { restaurantRouter } from "@/server/routers/restaurant";
import { categoryRouter } from "@/server/routers/category";

export const appRouter = router({
  restaurant: restaurantRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
