import { trpc } from "@/lib/trpc";

export const useSubmitSoloSeatReport = () =>
  trpc.soloSeatReport.create.useMutation();
