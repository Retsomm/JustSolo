import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ProfileIcon } from "@/components/icons/Icons";
import { useUpdateUserAvatar } from "@/hooks/useUpdateUserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { processPickedImageToDataUrl } from "@/lib/imageCrop";
import { trpc } from "@/lib/trpc";
import { OrganicRadius, FontFamily, OrganicSpacing } from "@/constants/organicTheme";

const AVATAR_SIZE = 72;

// 比照網頁版 AvatarUploader：顯示目前大頭貼（沒有就顯示預設圖示）＋上傳按鈕。
// 裁切互動改用系統原生相簿選取器的 allowsEditing（見 src/lib/imageCrop.ts
// 開頭的說明），選完直接處理＋送出，不需要另外刻一個裁切彈窗。
export const AvatarUploader = () => {
  const { data: profile } = useUserProfile();
  const theme = useOrganicTheme();
  const utils = trpc.useUtils();
  const updateAvatar = useUpdateUserAvatar();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("需要相簿權限才能上傳大頭貼");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setIsProcessing(true);
    try {
      const dataUrl = await processPickedImageToDataUrl(uri);
      updateAvatar.mutate(
        { image: dataUrl },
        {
          onSuccess: async () => {
            await utils.user.getProfile.invalidate();
          },
          onError: () => setError("上傳失敗，請稍後再試。"),
          onSettled: () => setIsProcessing(false),
        },
      );
    } catch {
      setError("裁切失敗，請重新選擇圖片。");
      setIsProcessing(false);
    }
  };

  const isPending = isProcessing || updateAvatar.isPending;

  return (
    <View style={styles.container}>
      {profile?.image ? (
        <Image source={{ uri: profile.image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { borderColor: theme.border }]}>
          <ProfileIcon color={theme.textSecondary} size={32} />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="上傳大頭貼"
        disabled={isPending}
        onPress={handlePress}
        style={[styles.uploadButton, { borderColor: theme.border }, isPending && styles.disabled]}
      >
        {isPending ? (
          <ActivityIndicator color={theme.text} size="small" />
        ) : (
          <Text style={[styles.uploadButtonLabel, { color: theme.text }]}>上傳大頭貼</Text>
        )}
      </Pressable>

      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: OrganicSpacing[2],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: 6,
    minWidth: 96,
    alignItems: "center",
  },
  uploadButtonLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    textAlign: "center",
  },
});
