import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { BackIcon, MoonIcon, SunIcon } from "@/components/icons/Icons";
import { useOrganicTheme, useThemeToggle } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicSpacing } from "@/constants/organicTheme";

type AppHeaderProps = {
  showBack?: boolean;
};

export const AppHeader = ({ showBack = false }: AppHeaderProps) => {
  const theme = useOrganicTheme();
  const router = useRouter();
  const { scheme, toggleScheme } = useThemeToggle();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.text }]}>JustSolo</Text>
      <View style={styles.actions}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="返回"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={[styles.iconButton, { borderColor: theme.border }]}
          >
            <BackIcon color={theme.text} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="切換主題色"
          onPress={toggleScheme}
          style={[styles.iconButton, { borderColor: theme.border }]}
        >
          {scheme === "dark" ? <MoonIcon color={theme.text} /> : <SunIcon color={theme.text} />}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: OrganicSpacing[4],
    paddingTop: OrganicSpacing[3],
    paddingBottom: OrganicSpacing[2],
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 19,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
