import { router, publicProcedure } from "../trpc";
import { getAllDistricts } from "../services/districtService";

export const districtRouter = router({
  list: publicProcedure.query(() => getAllDistricts()),
});
