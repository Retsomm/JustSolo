import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";

import { HeartIcon, HomeIcon, MapIcon, ProfileIcon } from "@/components/icons/Icons";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily } from "@/constants/organicTheme";

const toColorString = (color: ColorValue) => color as string;

export default function TabsLayout() {
  const theme = useOrganicTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.body,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ color }) => <HomeIcon color={toColorString(color)} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "地圖",
          tabBarIcon: ({ color }) => <MapIcon color={toColorString(color)} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "收藏",
          tabBarIcon: ({ color }) => <HeartIcon color={toColorString(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ color }) => <ProfileIcon color={toColorString(color)} />,
        }}
      />
    </Tabs>
  );
}
