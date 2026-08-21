import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { Pagination } from "@/components/Pagination";
import { StatusTag } from "@/components/StatusTag";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

const FavoritesTabScreen = () => {
  const theme = useOrganicTheme();
  const router = useRouter();
  const { status, signInWithGoogle } = useAuth();
  const [page, setPage] = useState(1);
  // 401 時的登出處理集中在 trpc.ts 的 fetch 攔截器＋useAuth 的 unauthorizedHandler
  // 註冊機制，這裡不用再另外判斷 error.data.code，見已知的坑第 26 條。
  const { data, isLoading } = useFavorites(page);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      <AppHeader />

      {status === "loading" && (
        <View style={styles.centerContent}>
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      {status === "signedOut" && (
        <View style={styles.centerContent}>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            登入後可以收藏餐廳，方便下次直接找到
          </Text>
          <Button label="使用 Google 登入" variant="primary" onPress={signInWithGoogle} />
        </View>
      )}

      {status === "signedIn" && (
        <ScrollView contentContainerStyle={styles.content}>
          {isLoading && <ActivityIndicator color={theme.accent} style={styles.spacerTop} />}

          {!isLoading && data?.items.length === 0 && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              還沒有收藏的餐廳，去首頁逛逛看吧
            </Text>
          )}

          {data?.items.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/restaurant/${r.id}`)}
              style={[styles.card, { backgroundColor: theme.surface }]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>{r.categoryName}</Text>
              </View>
              <Text style={[styles.cardAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                {r.address}
              </Text>
              <View style={styles.cardFooterRow}>
                <StatusTag status={r.soloSeatStatus} />
                <View style={styles.cardFooterRight}>
                  <FriendlinessBadge score={r.soloFriendlinessScore} label={r.soloFriendlinessLabel} />
                  <FavoriteButton restaurantId={r.id} size={16} />
                </View>
              </View>
            </Pressable>
          ))}

          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FavoritesTabScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContent: {
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
  content: {
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[3],
  },
  spacerTop: {
    marginTop: OrganicSpacing[3],
  },
  card: {
    borderRadius: OrganicRadius.lg,
    padding: OrganicSpacing[4],
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: OrganicSpacing[2],
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
  },
  cardCategory: {
    fontFamily: FontFamily.body,
    fontSize: 11,
  },
  cardAddress: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrganicSpacing[2],
  },
});
