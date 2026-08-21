import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { priceLevelLabel } from "@justsolo/shared";

import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import { buildAbsolutePlacePhotoUrl } from "@/lib/placePhoto";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

const THUMBNAIL_WIDTH_PX = 200;

export type PlaceDetailsTab = "overview" | "menu" | "reviews" | "photos";

type PlaceDetailsSectionProps = {
  restaurantId: string;
  activeTab: PlaceDetailsTab;
};

const InfoNote = ({ text }: { text: string }) => {
  const theme = useOrganicTheme();
  return <Text style={[styles.note, { color: theme.textSecondary }]}>{text}</Text>;
};

export const PlaceDetailsSection = ({ restaurantId, activeTab }: PlaceDetailsSectionProps) => {
  const theme = useOrganicTheme();
  const { data, isLoading, isError } = useRestaurantPlaceDetails(restaurantId);

  if (isLoading) return <InfoNote text="載入更多資訊中…" />;
  if (isError || !data) return <InfoNote text="目前沒有更多資訊可顯示。" />;

  if (activeTab === "overview") {
    const price = priceLevelLabel(data.priceLevel);
    const hasContent = data.rating !== null || price || data.editorialSummary || data.openingHours;
    if (!hasContent) return <InfoNote text="目前沒有更多資訊可顯示。" />;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          {data.rating !== null && (
            <Text style={{ color: theme.text, fontFamily: FontFamily.body, fontSize: 14 }}>
              ⭐ {data.rating}
              {data.userRatingCount !== null && `（Google 上共 ${data.userRatingCount} 人評分）`}
            </Text>
          )}
          {price && (
            <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.body, fontSize: 14 }}>
              · {price}
            </Text>
          )}
        </View>
        {data.editorialSummary && (
          <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.body, fontSize: 13 }}>
            {data.editorialSummary}
          </Text>
        )}
        {data.openingHours && (
          <View>
            <Text style={{ color: theme.text, fontFamily: FontFamily.bodyMedium, fontSize: 13 }}>
              營業時間
            </Text>
            {data.openingHours.map((line) => (
              <Text
                key={line}
                style={{ color: theme.textSecondary, fontFamily: FontFamily.body, fontSize: 13 }}
              >
                {line}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (activeTab === "menu") {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, gap: OrganicSpacing[1] }]}>
        {data.websiteUri && (
          <Pressable onPress={() => Linking.openURL(data.websiteUri!)}>
            <Text style={[styles.link, { color: theme.accent }]}>前往官網</Text>
          </Pressable>
        )}
        <Pressable onPress={() => Linking.openURL(data.googleMapsUri)}>
          <Text style={[styles.link, { color: theme.accent }]}>在 Google Maps 上查看菜單與更多資訊</Text>
        </Pressable>
      </View>
    );
  }

  if (activeTab === "reviews") {
    if (data.reviews.length === 0) return <InfoNote text="目前沒有評論。" />;

    return (
      <View style={{ gap: OrganicSpacing[3] }}>
        <Text style={[styles.smallNote, { color: theme.textSecondary }]}>
          Google 只提供最多 5 則精選評論
          {data.userRatingCount !== null && `（Google 上共 ${data.userRatingCount} 人評分）`}，
          <Text style={{ color: theme.accent }} onPress={() => Linking.openURL(data.googleMapsUri)}>
            完整評論請至 Google Maps 查看
          </Text>
          。
        </Text>
        {data.reviews.map((review, i) => (
          <View key={`${review.authorName}-${i}`} style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.row}>
              <Text style={{ color: theme.text, fontFamily: FontFamily.bodyMedium, fontSize: 13 }}>
                {review.authorName}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{"⭐".repeat(review.rating)}</Text>
              {review.relativeTime && (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>· {review.relativeTime}</Text>
              )}
            </View>
            {review.text && (
              <Text style={{ color: theme.textSecondary, fontFamily: FontFamily.body, fontSize: 13 }}>
                {review.text}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  }

  // activeTab === "photos"
  if (data.photos.length === 0) return <InfoNote text="目前沒有照片。" />;

  return (
    <View style={styles.photoGrid}>
      {data.photos.map((photo) => (
        <Image
          key={photo.name}
          source={{ uri: buildAbsolutePlacePhotoUrl(photo.name, THUMBNAIL_WIDTH_PX) }}
          style={styles.photoThumb}
          contentFit="cover"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: OrganicRadius.lg,
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrganicSpacing[1],
    flexWrap: "wrap",
  },
  note: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  smallNote: {
    fontFamily: FontFamily.body,
    fontSize: 12,
  },
  link: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: OrganicSpacing[2],
  },
  photoThumb: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: OrganicRadius.sm,
  },
});
