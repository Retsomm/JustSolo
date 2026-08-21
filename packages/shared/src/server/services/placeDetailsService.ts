import { findRestaurantPlaceId } from "../clients/prismaClient";
import { fetchPlaceDetails } from "../clients/placesClient";
import type { PlaceDetails } from "../clients/placesClient";

// 組合層：先查這間餐廳的 Google placeId，有才去打 Place Details API。
// 沒有 placeId（尚未匯入/匯入時沒對到）就直接回傳 null，不打 Google API。
export const getRestaurantPlaceDetails = async (
  restaurantId: string,
): Promise<PlaceDetails | null> => {
  const placeId = await findRestaurantPlaceId(restaurantId);
  if (!placeId) return null;

  return fetchPlaceDetails(placeId);
};
