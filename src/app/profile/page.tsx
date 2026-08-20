import { Suspense } from "react";
import { ProfileView } from "./ProfileView";

// ProfileView 用 useSearchParams 讀 ?tab=favorites 深連結（NavBar 的「收藏」
// 連結指到這裡），Next.js 要求包一層 Suspense，比照 /restaurant/[id] 既有的
// server component 包 client view 的寫法。
const ProfilePage = () => (
  <Suspense fallback={null}>
    <ProfileView />
  </Suspense>
);

export default ProfilePage;
