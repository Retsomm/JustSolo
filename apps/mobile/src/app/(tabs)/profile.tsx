import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { trpc } from "@/lib/trpc";
import { FontFamily, OrganicSpacing } from "@/constants/organicTheme";

export default function ProfileTabScreen() {
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
}

const SignedInProfile = ({ onSignOut }: { onSignOut: () => void }) => {
  const theme = useOrganicTheme();
  const { data, isLoading } = trpc.user.getProfile.useQuery();

  return (
    <>
      {isLoading && <Text style={[styles.message, { color: theme.textSecondary }]}>載入中…</Text>}
      {!isLoading && (
        <>
          {data?.image && <Image source={{ uri: data.image }} style={styles.avatar} />}
          <Text style={[styles.name, { color: theme.text }]}>{data?.name ?? "已登入"}</Text>
        </>
      )}
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
  name: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  signOutButton: {
    marginTop: OrganicSpacing[4],
  },
});
