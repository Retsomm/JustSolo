import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { soloSeatStatusLabel } from "@justsolo/shared";

import { AppHeader } from "@/components/AppHeader";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { PlaceDetailsSection } from "@/components/PlaceDetailsSection";
import type { PlaceDetailsTab } from "@/components/PlaceDetailsSection";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

type TabKey = PlaceDetailsTab | "soloFriendly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "總覽" },
  { key: "menu", label: "菜單" },
  { key: "reviews", label: "評論" },
  { key: "soloFriendly", label: "單人友善" },
  { key: "photos", label: "圖片" },
];

export default function RestaurantDetailScreen() {
  const theme = useOrganicTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useRestaurantDetail(id);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      <AppHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator color={theme.accent} />}

        {isError && (
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>載入失敗，請稍後再試。</Text>
        )}

        {!isLoading && !isError && !data && (
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>找不到這間餐廳。</Text>
        )}

        {data && (
          <>
            <View style={styles.titleRow}>
              <View style={styles.titleColumn}>
                <Text style={[styles.title, { color: theme.text }]}>{data.name}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{data.categoryName}</Text>
                <Text style={[styles.address, { color: theme.text }]}>{data.address}</Text>
                {data.phone && <Text style={[styles.address, { color: theme.text }]}>電話：{data.phone}</Text>}
              </View>
              <FavoriteButton restaurantId={data.id} />
            </View>

            <View style={[styles.tabBar, { borderColor: theme.border }]}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tabItem, isActive && { backgroundColor: theme.accent }]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? theme.accentText : theme.text },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === "soloFriendly" ? (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.bodyText, { color: theme.text }]}>
                  {soloSeatStatusLabel(data.soloSeatStatus)}
                  {data.soloSeatType ? `・${data.soloSeatType}` : ""}
                </Text>
                <FriendlinessBadge score={data.soloFriendlinessScore} label={data.soloFriendlinessLabel} />
                {data.reportCount > 0 && (
                  <Text style={[styles.bodyTextSecondary, { color: theme.textSecondary }]}>
                    單人座位信心：{Math.round(data.soloSeatConfidence * 100)}%（{data.reportCount} 則回報）
                  </Text>
                )}
                <Text style={[styles.bodyTextSecondary, { color: theme.textSecondary }]}>
                  登入後可以回報這裡是否有單人座位，這一輪還沒開放。
                </Text>
              </View>
            ) : (
              <PlaceDetailsSection restaurantId={data.id} activeTab={activeTab} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[4],
  },
  stateText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: OrganicSpacing[2],
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: 4,
  },
  address: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginTop: 6,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: OrganicRadius.pill,
    borderWidth: 1,
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: OrganicSpacing[2],
  },
  tabLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  card: {
    borderRadius: OrganicRadius.lg,
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[2],
    alignItems: "flex-start",
  },
  bodyText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  bodyTextSecondary: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
});
