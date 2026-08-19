import { RestaurantDetailView } from "./RestaurantDetailView";

export default async function RestaurantDetailPage(
  props: PageProps<"/restaurant/[id]">,
) {
  const { id } = await props.params;

  return <RestaurantDetailView id={id} />;
}
