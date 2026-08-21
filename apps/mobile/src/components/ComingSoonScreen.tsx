import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicSpacing } from "@/constants/organicTheme";

type ComingSoonScreenProps = {
  message: string;
};

export const ComingSoonScreen = ({ message }: ComingSoonScreenProps) => {
  const theme = useOrganicTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["bottom"]}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: OrganicSpacing[6],
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
