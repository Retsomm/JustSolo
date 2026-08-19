import { router, publicProcedure } from "@/server/trpc";
import { getAllDistricts } from "@/server/services/districtService";

export const districtRouter = router({
  list: publicProcedure.query(() => getAllDistricts()),
});
