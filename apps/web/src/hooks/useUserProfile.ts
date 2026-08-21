import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

// 大頭貼不透過 session/JWT 傳遞（會讓 cookie 過大導致 431 錯誤，
// 見 src/auth.ts 的說明），改成直接查 DB 取得目前的名稱/大頭貼。
export const useUserProfile = () => {
  const { status } = useSession();
  return trpc.user.getProfile.useQuery(undefined, {
    enabled: status === "authenticated",
  });
};
