import { trpc } from "@/lib/trpc";

export const useRestaurantDetail = (id: string) =>
  trpc.restaurant.getById.useQuery({ id });
