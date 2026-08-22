import { trpc } from "@/lib/trpc";

export const useDeleteSoloSeatReport = () => trpc.soloSeatReport.delete.useMutation();
