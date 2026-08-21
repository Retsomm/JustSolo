import { router, publicProcedure } from "../trpc";
import { getAllCategories } from "../services/categoryService";

export const categoryRouter = router({
  list: publicProcedure.query(() => getAllCategories()),
});
