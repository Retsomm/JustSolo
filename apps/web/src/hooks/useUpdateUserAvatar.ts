import { trpc } from "@/lib/trpc";

export const useUpdateUserAvatar = () => trpc.user.updateAvatar.useMutation();
