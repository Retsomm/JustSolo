import { router } from "@/server/trpc";
import { restaurantRouter } from "@/server/routers/restaurant";

export const appRouter = router({
  restaurant: restaurantRouter,
});

export type AppRouter = typeof appRouter;
