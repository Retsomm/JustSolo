import { router } from "@/server/trpc";
import { restaurantRouter } from "@/server/routers/restaurant";
import { categoryRouter } from "@/server/routers/category";
import { districtRouter } from "@/server/routers/district";
import { soloSeatReportRouter } from "@/server/routers/soloSeatReport";

export const appRouter = router({
  restaurant: restaurantRouter,
  category: categoryRouter,
  district: districtRouter,
  soloSeatReport: soloSeatReportRouter,
});

export type AppRouter = typeof appRouter;
