import { StyleSheet, Text } from "react-native";
import { soloSeatStatusLabel } from "@justsolo/shared";
import type { SoloSeatStatus } from "@justsolo/shared";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius } from "@/constants/organicTheme";

type StatusTagProps = {
  status: SoloSeatStatus;
  fontSize?: number;
};

export const StatusTag = ({ status, fontSize = 11 }: StatusTagProps) => {
  const theme = useOrganicTheme();

  const { bg, fg } =
    status === "CONFIRMED_YES"
      ? { bg: theme.accent2Tint, fg: theme.accent2TintText }
      : status === "CONFIRMED_NO"
        ? { bg: "transparent", fg: theme.accent }
        : { bg: theme.neutralTint, fg: theme.neutralTintText };

  return (
    <Text
      style={[
        styles.tag,
        {
          backgroundColor: bg,
          color: fg,
          fontSize,
          borderWidth: status === "CONFIRMED_NO" ? 1 : 0,
          borderColor: theme.accent,
        },
      ]}
    >
      {soloSeatStatusLabel(status)}
    </Text>
  );
};

const styles = StyleSheet.create({
  tag: {
    fontFamily: FontFamily.body,
    letterSpacing: 0.2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: OrganicRadius.pill,
    overflow: "hidden",
  },
});
