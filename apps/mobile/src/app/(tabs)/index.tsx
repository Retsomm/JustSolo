import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { soloSeatStatusLabel } from "@justsolo/shared";

import { AppHeader } from "@/components/AppHeader";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FilterBar } from "@/components/FilterBar";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { Pagination } from "@/components/Pagination";
import { StatusTag } from "@/components/StatusTag";
import { ShuffleIcon, FilterIcon, ArrowRightIcon } from "@/components/icons/Icons";
import { Button } from "@/components/Button";
import { useCategories } from "@/hooks/useCategories";
import { useDistricts } from "@/hooks/useDistricts";
import { useRestaurantPick } from "@/hooks/useRestaurantPick";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { buildAbsolutePlacePhotoUrl } from "@/lib/placePhoto";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

const CITY = "台中市";
const SEARCH_DEBOUNCE_MS = 300;
const HERO_PHOTO_WIDTH_PX = 640;

export default function HomeScreen() {
  const theme = useOrganicTheme();
  const router = useRouter();

  const [category, setCategory] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [soloSeatOnly, setSoloSeatOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebouncedValue(keywordInput, SEARCH_DEBOUNCE_MS);

  const { data: categories } = useCategories();
  const { data: districts } = useDistricts();

  const filterInput = {
    category,
    district,
    keyword: debouncedKeyword || undefined,
    city: CITY,
    soloSeatOnly,
  };

  const { data: pick, isLoading: isPickLoading } = useRestaurantPick({
    ...filterInput,
    excludeIds: excludedIds,
  });
  const current = pick?.restaurant ?? null;

  const { data: placeDetails } = useRestaurantPlaceDetails(current?.id ?? "", {
    enabled: !!current,
  });
  const heroPhoto = placeDetails?.photos[0];

  const { data: list, isLoading: isListLoading } = useRestaurantSearch({ ...filterInput, page });

  const resetPick = () => {
    setExcludedIds([]);
    setPage(1);
  };

  const handleShuffle = () => {
    if (current) setExcludedIds((prev) => [...prev, current.id]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          今天，想一個人去哪裡吃？一次只推薦一家，慢慢挑。
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => setFilterOpen((v) => !v)}
          style={styles.filterToggle}
        >
          <FilterIcon color={theme.accent} />
          <Text style={[styles.filterToggleLabel, { color: theme.accent }]}>篩選條件</Text>
        </Pressable>

        {filterOpen && (
          <FilterBar
            categories={categories ?? []}
            districts={districts ?? []}
            category={category}
            onCategoryChange={(value) => {
              setCategory(value);
              resetPick();
            }}
            district={district}
            onDistrictChange={(value) => {
              setDistrict(value);
              resetPick();
            }}
            keyword={keywordInput}
            onKeywordChange={(value) => {
              setKeywordInput(value);
              resetPick();
            }}
            soloSeatOnly={soloSeatOnly}
            onSoloSeatOnlyChange={(value) => {
              setSoloSeatOnly(value);
              resetPick();
            }}
          />
        )}

        {isPickLoading && <ActivityIndicator color={theme.accent} style={styles.spacerTop} />}

        {!isPickLoading && current && (
          <>
            <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
              {heroPhoto ? (
                <Image
                  source={{ uri: buildAbsolutePlacePhotoUrl(heroPhoto.name, HERO_PHOTO_WIDTH_PX) }}
                  style={styles.heroPhoto}
                />
              ) : (
                <View style={[styles.heroPhoto, styles.heroPhotoPlaceholder]}>
                  <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.body }}>尚無照片</Text>
                </View>
              )}
              <View style={styles.heroBody}>
                <View style={styles.heroHeaderRow}>
                  <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>
                    {current.name}
                  </Text>
                  <View style={styles.heroHeaderRight}>
                    <FriendlinessBadge score={current.soloFriendlinessScore} label={current.soloFriendlinessLabel} />
                    <FavoriteButton restaurantId={current.id} />
                  </View>
                </View>
                <Text style={[styles.heroMeta, { color: theme.textSecondary }]}>
                  {current.categoryName} · {current.address}
                </Text>
                <Text style={[styles.heroStatus, { color: theme.text }]}>
                  {soloSeatStatusLabel(current.soloSeatStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Button label="換一家" variant="secondary" icon={<ShuffleIcon color={theme.text} />} onPress={handleShuffle} />
              <Button
                label="前往看看"
                variant="primary"
                icon={<ArrowRightIcon color={theme.accentText} />}
                iconPosition="right"
                onPress={() => router.push(`/restaurant/${current.id}`)}
              />
            </View>
          </>
        )}

        {!isPickLoading && !current && (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            目前沒有符合條件的餐廳，換個篩選條件試試？
          </Text>
        )}

        <Pressable accessibilityRole="button" onPress={() => setListOpen((v) => !v)} style={styles.listToggle}>
          <Text style={[styles.listToggleLabel, { color: theme.accent }]}>
            {listOpen ? "收起完整列表" : `或查看完整列表（${pick?.totalCount ?? 0} 家）`}
          </Text>
        </Pressable>

        {listOpen && (
          <View style={styles.listSection}>
            {isListLoading && <ActivityIndicator color={theme.accent} />}

            {list?.items.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/restaurant/${r.id}`)}
                style={[styles.listCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.listCardHeaderRow}>
                  <Text style={[styles.listCardTitle, { color: theme.text }]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={[styles.listCardCategory, { color: theme.textSecondary }]}>{r.categoryName}</Text>
                </View>
                <Text style={[styles.listCardAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                  {r.address}
                </Text>
                <View style={styles.listCardFooterRow}>
                  <StatusTag status={r.soloSeatStatus} />
                  <View style={styles.listCardFooterRight}>
                    <FriendlinessBadge score={r.soloFriendlinessScore} label={r.soloFriendlinessLabel} />
                    <FavoriteButton restaurantId={r.id} size={16} />
                  </View>
                </View>
              </Pressable>
            ))}

            {!isListLoading && list?.items.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                目前沒有符合條件的餐廳，換個篩選條件試試？
              </Text>
            )}

            {list && <Pagination page={list.page} totalPages={list.totalPages} onPageChange={setPage} />}
          </View>
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
  intro: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filterToggleLabel: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  spacerTop: {
    marginTop: OrganicSpacing[3],
  },
  heroCard: {
    borderRadius: OrganicRadius.lg,
    overflow: "hidden",
  },
  heroPhoto: {
    width: "100%",
    height: 208,
  },
  heroPhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    padding: OrganicSpacing[4],
    gap: 4,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: OrganicSpacing[2],
  },
  heroTitle: {
    flex: 1,
    fontFamily: FontFamily.heading,
    fontSize: 20,
  },
  heroHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrganicSpacing[2],
  },
  heroMeta: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  heroStatus: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: OrganicSpacing[3],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
  },
  listToggle: {
    alignItems: "center",
  },
  listToggleLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  listSection: {
    gap: OrganicSpacing[3],
  },
  listCard: {
    borderRadius: OrganicRadius.lg,
    padding: OrganicSpacing[4],
    gap: 4,
  },
  listCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: OrganicSpacing[2],
  },
  listCardTitle: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
  },
  listCardCategory: {
    fontFamily: FontFamily.body,
    fontSize: 11,
  },
  listCardAddress: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  listCardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  listCardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrganicSpacing[2],
  },
});
