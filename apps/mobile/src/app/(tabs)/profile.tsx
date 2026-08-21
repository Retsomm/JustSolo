import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { AvatarUploader } from "@/components/AvatarUploader";
import { Button } from "@/components/Button";
import { EditableName } from "@/components/EditableName";
import { useAuth } from "@/hooks/useAuth";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicSpacing } from "@/constants/organicTheme";

const ProfileTabScreen = () => {
  const theme = useOrganicTheme();
  const { status, signInWithGoogle, signOut } = useAuth();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      <AppHeader />
      <View style={styles.content}>
        {status === "loading" && (
          <Text style={[styles.message, { color: theme.textSecondary }]}>載入中…</Text>
        )}
        {status === "signedOut" && (
          <>
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              登入後可以收藏餐廳、回報單人座位資訊
            </Text>
            <Button label="使用 Google 登入" variant="primary" onPress={signInWithGoogle} />
          </>
        )}
        {status === "signedIn" && <SignedInProfile onSignOut={signOut} />}
      </View>
    </SafeAreaView>
  );
};

export default ProfileTabScreen;

const SignedInProfile = ({ onSignOut }: { onSignOut: () => void }) => {
  // 401 時的登出處理集中在 trpc.ts 的 fetch 攔截器＋useAuth 的 unauthorizedHandler
  // 註冊機制，這裡不用再另外判斷 error.data.code，見已知的坑第 26 條。
  // 大頭貼/名稱的顯示與編輯比照網頁版拆成 AvatarUploader/EditableName 兩個
  // 元件，兩者都各自呼叫 useUserProfile()（不經 session，直接查 DB）。
  return (
    <>
      <AvatarUploader />
      <EditableName />
      <Button label="登出" onPress={onSignOut} style={styles.signOutButton} />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: OrganicSpacing[4],
    paddingHorizontal: OrganicSpacing[6],
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  signOutButton: {
    marginTop: OrganicSpacing[4],
  },
});
