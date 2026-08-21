import { trpc } from "@/lib/trpc";

export const useRestaurantPlaceDetails = (
  id: string,
  options?: { enabled?: boolean },
) => trpc.restaurant.placeDetails.useQuery({ id }, options);
