import { router, protectedProcedure } from "@/server/trpc";
import { createSoloSeatReportInputSchema } from "@/types/soloSeatReport";
import { submitSoloSeatReport } from "@/server/services/soloSeatReportService";

export const soloSeatReportRouter = router({
  create: protectedProcedure
    .input(createSoloSeatReportInputSchema)
    .mutation(({ input, ctx }) =>
      submitSoloSeatReport({ ...input, userId: ctx.session.user.id }),
    ),
});
