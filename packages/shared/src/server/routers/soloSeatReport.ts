import { router, protectedProcedure } from "../trpc";
import {
  createSoloSeatReportInputSchema,
  soloSeatReportByRestaurantInputSchema,
} from "../../types/soloSeatReport";
import {
  deleteSoloSeatReport,
  getMySoloSeatReport,
  submitSoloSeatReport,
} from "../services/soloSeatReportService";

export const soloSeatReportRouter = router({
  create: protectedProcedure
    .input(createSoloSeatReportInputSchema)
    .mutation(({ input, ctx }) =>
      submitSoloSeatReport({ ...input, userId: ctx.session.user.id }),
    ),

  getMine: protectedProcedure
    .input(soloSeatReportByRestaurantInputSchema)
    .query(({ input, ctx }) =>
      getMySoloSeatReport(ctx.session.user.id, input.restaurantId),
    ),

  delete: protectedProcedure
    .input(soloSeatReportByRestaurantInputSchema)
    .mutation(({ input, ctx }) =>
      deleteSoloSeatReport(ctx.session.user.id, input.restaurantId),
    ),
});
