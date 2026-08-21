import { StyleSheet, Text, View } from "react-native";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius } from "@/constants/organicTheme";

type FriendlinessBadgeProps = {
  score: number;
  label: string;
};

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
      <Text style={[styles.score, { color: fg }]}>{score}</Text>
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
  score: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    opacity: 0.7,
  },
});
