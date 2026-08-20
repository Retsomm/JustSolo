import { trpc } from "@/lib/trpc";

export const useRestaurantPlaceDetails = (id: string) =>
  trpc.restaurant.placeDetails.useQuery({ id });
