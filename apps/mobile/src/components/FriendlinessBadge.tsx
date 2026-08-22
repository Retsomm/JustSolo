import { StyleSheet, Text, View } from "react-native";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius } from "@/constants/organicTheme";

type FriendlinessBadgeProps = {
  score: number;
  label: string;
};

// score 只用來決定顏色深淺，不直接顯示數字——App 裡沒有任何地方說明這個
// 0-100 分是怎麼算出來的，2026-08-22 使用者反應看到裸數字（例如「未知，
// 建議致電確認 40」）會誤以為是別的意思（信心百分比／評分），決定只留文字標籤。
export const FriendlinessBadge = ({ score, label }: FriendlinessBadgeProps) => {
  const theme = useOrganicTheme();

  const { bg, fg } =
    score >= 65
      ? { bg: theme.accent2Tint, fg: theme.accent2TintText }
      : score >= 35
        ? { bg: theme.neutralTint, fg: theme.neutralTintText }
        : { bg: "transparent", fg: theme.accent };

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
  },
});
