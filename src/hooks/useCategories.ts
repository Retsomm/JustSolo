import { trpc } from "@/lib/trpc";

export const useCategories = () => trpc.category.list.useQuery();
