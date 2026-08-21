import { router, protectedProcedure } from "../trpc";
import { createSoloSeatReportInputSchema } from "../../types/soloSeatReport";
import { submitSoloSeatReport } from "../services/soloSeatReportService";

export const soloSeatReportRouter = router({
  create: protectedProcedure
    .input(createSoloSeatReportInputSchema)
    .mutation(({ input, ctx }) =>
      submitSoloSeatReport({ ...input, userId: ctx.session.user.id }),
    ),
});
