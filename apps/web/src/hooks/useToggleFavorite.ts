import { trpc } from "@/lib/trpc";

export const useToggleFavorite = () => trpc.favorite.toggle.useMutation();
