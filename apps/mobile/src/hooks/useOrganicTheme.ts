import { useColorScheme } from "react-native";
import { OrganicColors } from "@/constants/organicTheme";

export const useOrganicTheme = () => {
  const scheme = useColorScheme();
  return OrganicColors[scheme === "dark" ? "dark" : "light"];
};
