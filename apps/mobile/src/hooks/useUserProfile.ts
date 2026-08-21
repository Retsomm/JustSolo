import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

// 比照網頁版 useUserProfile：大頭貼/名稱不透過 session 傳遞，直接查 DB 拿目前值。
export const useUserProfile = () => {
  const { status } = useAuth();
  return trpc.user.getProfile.useQuery(undefined, {
    enabled: status === "signedIn",
  });
};
