import { trpc } from "@/lib/trpc";

export const useUpdateUserName = () => trpc.user.updateName.useMutation();
