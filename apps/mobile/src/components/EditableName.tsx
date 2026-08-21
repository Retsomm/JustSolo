import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useUpdateUserName } from "@/hooks/useUpdateUserName";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { trpc } from "@/lib/trpc";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

// 比照網頁版 EditableName：預設唯讀名稱＋編輯按鈕，點擊後變成輸入框＋
// 儲存/取消，空白名稱擋在前端不送出，儲存成功 invalidate user.getProfile
// （不經 session，見已知的坑：JWT session 不能塞大型/易變資料）。
export const EditableName = () => {
  const { data: profile } = useUserProfile();
  const theme = useOrganicTheme();
  const utils = trpc.useUtils();
  const updateName = useUpdateUserName();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isEditing) {
    return (
      <View style={styles.row}>
        <Text style={[styles.name, { color: theme.text }]}>{profile?.name ?? "使用者"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="編輯名稱"
          onPress={() => {
            setValue(profile?.name ?? "");
            setError(null);
            setIsEditing(true);
          }}
          style={[styles.editButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.editButtonLabel, { color: theme.text }]}>編輯</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("名稱不能是空白");
      return;
    }

    updateName.mutate(
      { name: trimmed },
      {
        onSuccess: async () => {
          await utils.user.getProfile.invalidate();
          setIsEditing(false);
        },
        onError: () => setError("更新失敗，請稍後再試。"),
      },
    );
  };

  return (
    <View style={styles.editingContainer}>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={setValue}
          accessibilityLabel="名稱"
          maxLength={50}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="儲存"
          disabled={updateName.isPending}
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.accent }, updateName.isPending && styles.disabled]}
        >
          <Text style={[styles.saveButtonLabel, { color: theme.accentText }]}>儲存</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="取消"
          onPress={() => setIsEditing(false)}
          style={[styles.editButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.editButtonLabel, { color: theme.text }]}>取消</Text>
        </Pressable>
      </View>
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrganicSpacing[2],
  },
  editingContainer: {
    gap: 4,
    alignItems: "center",
  },
  name: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
  },
  editButton: {
    borderWidth: 1,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: 4,
  },
  editButtonLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
  },
  saveButton: {
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: 6,
  },
  saveButtonLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: 6,
    fontFamily: FontFamily.body,
    fontSize: 14,
    minWidth: 140,
  },
  error: {
    fontFamily: FontFamily.body,
    fontSize: 12,
  },
});
