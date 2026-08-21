import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Android 模擬器（AVD）的虛擬網路把 host 電腦的 loopback 對應到這個固定位址，
// 跟實機／iOS 模擬器完全不同，不能套同一套「抓 LAN IP」邏輯。
const ANDROID_EMULATOR_LOCALHOST = "10.0.2.2";

// Milestone 1 沒有已部署的後端，以本機開發為主：優先用明確設定的環境變數
// （未來真的部署後端時用這個覆寫），否則從 Expo 印出的 hostUri 抓開發機的區網
// IP，讓實機（不是模擬器）也能連到跑在同一台電腦上的 `yarn dev`。
export const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === "android" && !Device.isDevice) {
    return `http://${ANDROID_EMULATOR_LOCALHOST}:3000`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const lanIp = hostUri?.split(":")[0];
  if (lanIp) return `http://${lanIp}:3000`;

  return "http://localhost:3000";
};
