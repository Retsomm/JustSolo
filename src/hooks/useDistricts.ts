import { trpc } from "@/lib/trpc";

export const useDistricts = () => trpc.district.list.useQuery();
