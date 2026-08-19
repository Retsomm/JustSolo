import { router, publicProcedure } from "@/server/trpc";
import { getAllCategories } from "@/server/services/categoryService";

export const categoryRouter = router({
  list: publicProcedure.query(() => getAllCategories()),
});
