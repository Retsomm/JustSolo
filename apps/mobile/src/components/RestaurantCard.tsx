import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RestaurantSearchResultWithFriendliness } from "@justsolo/shared";

import { StatusTag } from "@/components/StatusTag";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

type RestaurantCardProps = {
  restaurant: RestaurantSearchResultWithFriendliness;
  onPress: () => void;
  variant?: "hero" | "compact";
};

const PhotoPlaceholder = () => {
  const theme = useOrganicTheme();
  return (
    <View style={[styles.photoPlaceholder, { backgroundColor: theme.surface }]}>
      <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.body, fontSize: 12 }}>
        尚無照片
      </Text>
    </View>
  );
};

export const RestaurantCard = ({ restaurant, onPress, variant = "compact" }: RestaurantCardProps) => {
  const theme = useOrganicTheme();
  const isHero = variant === "hero";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.cardBg },
        isHero && styles.heroCard,
      ]}
    >
      {isHero && <PhotoPlaceholder />}
      <View style={isHero ? styles.heroBody : undefined}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.name,
              { color: theme.text, fontSize: isHero ? 20 : 15 },
            ]}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <StatusTag status={restaurant.soloSeatStatus} fontSize={isHero ? 11 : 10} />
        </View>
        <Text
          style={[styles.meta, { color: theme.textSecondary, fontSize: isHero ? 13 : 12 }]}
          numberOfLines={1}
        >
          {restaurant.categoryName} · {restaurant.address}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: OrganicRadius.lg,
    overflow: "hidden",
    padding: OrganicSpacing[3],
    gap: OrganicSpacing[2],
  },
  heroCard: {
    padding: 0,
  },
  heroBody: {
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[2],
  },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: OrganicSpacing[2],
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.heading,
  },
  meta: {
    fontFamily: FontFamily.body,
  },
});
