import { z } from "zod";

export const createSoloSeatReportInputSchema = z.object({
  restaurantId: z.string(),
  reportType: z.enum(["CONFIRMED_YES", "CONFIRMED_NO"]),
  note: z.string().max(200).optional(),
});

export type CreateSoloSeatReportInput = z.infer<
  typeof createSoloSeatReportInputSchema
>;
