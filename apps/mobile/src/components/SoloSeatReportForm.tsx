import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteSoloSeatReport } from "@/hooks/useDeleteSoloSeatReport";
import { useMySoloSeatReport } from "@/hooks/useMySoloSeatReport";
import { useSubmitSoloSeatReport } from "@/hooks/useSubmitSoloSeatReport";
import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { trpc } from "@/lib/trpc";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

const NOTE_MAX_LENGTH = 200;

type ReportType = "CONFIRMED_YES" | "CONFIRMED_NO";

const reportTypeLabel: Record<ReportType, string> = {
  CONFIRMED_YES: "有單人座位",
  CONFIRMED_NO: "沒有單人座位",
};

type SoloSeatReportFormProps = {
  restaurantId: string;
};

// 比照網頁版 SoloSeatReportForm：唯讀摘要＋編輯按鈕→表單＋送出/取消
// （跟 EditableName.tsx 同一套互動模式）。「有/沒有單人座位」在表單裡只是
// 選項（選了不會馬上送出），一定要按送出才會真的改變信心分數；使用者填過的
// 備註會留在唯讀摘要裡持續顯示，不會送出後就從畫面上消失不見。
export const SoloSeatReportForm = ({ restaurantId }: SoloSeatReportFormProps) => {
  const theme = useOrganicTheme();
  const { status, signInWithGoogle } = useAuth();
  const utils = trpc.useUtils();
  const { data: myReport } = useMySoloSeatReport(restaurantId);
  const submitReport = useSubmitSoloSeatReport();
  const deleteReport = useDeleteSoloSeatReport();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [note, setNote] = useState("");

  if (status !== "signedIn") {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.prompt, { color: theme.textSecondary }]}>
          登入後即可回報這間餐廳是否有單人座位。
        </Text>
        {status === "signedOut" && (
          <Button label="登入" onPress={signInWithGoogle} style={styles.actionButton} />
        )}
      </View>
    );
  }

  const startEditing = () => {
    setSelectedType(myReport?.reportType ?? null);
    setNote(myReport?.note ?? "");
    setIsEditing(true);
  };

  // 新增/編輯/刪除回報都會改變這間餐廳的 soloSeatStatus/soloSeatConfidence，
  // 這兩個欄位不是只出現在 restaurant.getById（詳情頁），首頁的推薦卡片
  // （restaurant.pickOne）、完整列表（restaurant.search）、「我的收藏」清單
  // （favorite.list）都各自快取了同一間餐廳的這兩個欄位。之前只 invalidate
  // restaurant.getById，導致回報成功後只有詳情頁本身更新，切回首頁還是看到
  // 回報前的舊信心分數——改成呼叫 tRPC React Query 的 router 層級
  // invalidate（`utils.restaurant.invalidate()` 會連帶 invalidate 底下所有
  // procedure 的快取，不用每個查詢各自手動列一次）讓所有顯示同一間餐廳資料的
  // 畫面在下次聚焦/重新掛載時都拿到最新聚合結果。
  const invalidateAfterReportChange = () =>
    Promise.all([
      utils.restaurant.invalidate(),
      utils.favorite.list.invalidate(),
      utils.soloSeatReport.getMine.invalidate({ restaurantId }),
    ]);

  const handleDelete = () => {
    deleteReport.mutate(
      { restaurantId },
      {
        onSuccess: async () => {
          await invalidateAfterReportChange();
        },
      },
    );
  };

  if (!isEditing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {myReport ? (
          <>
            <Text style={[styles.prompt, { color: theme.text }]}>
              你回報：{reportTypeLabel[myReport.reportType]}
            </Text>
            {myReport.note && (
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                備註：{myReport.note}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.prompt, { color: theme.text }]}>這間餐廳有單人座位嗎？</Text>
        )}
        <View style={styles.buttonRow}>
          <Button
            label={myReport ? "編輯" : "新增回報"}
            onPress={startEditing}
            disabled={deleteReport.isPending}
            style={styles.actionButton}
          />
          {myReport && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="刪除回報"
              disabled={deleteReport.isPending}
              onPress={handleDelete}
              style={[
                styles.deleteButton,
                { borderColor: theme.danger },
                deleteReport.isPending && styles.disabled,
              ]}
            >
              <Text style={[styles.deleteButtonLabel, { color: theme.danger }]}>刪除</Text>
            </Pressable>
          )}
        </View>
        {deleteReport.isError && (
          <Text style={[styles.noteText, { color: theme.danger }]}>刪除失敗，請稍後再試。</Text>
        )}
      </View>
    );
  }

  const handleSubmit = () => {
    if (!selectedType) return;

    submitReport.mutate(
      { restaurantId, reportType: selectedType, note: note.trim() || undefined },
      {
        onSuccess: async () => {
          await invalidateAfterReportChange();
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.prompt, { color: theme.text }]}>這間餐廳有單人座位嗎？</Text>
      <View style={styles.buttonRow}>
        {(["CONFIRMED_YES", "CONFIRMED_NO"] as const).map((type) => (
          <Button
            key={type}
            label={reportTypeLabel[type]}
            variant={selectedType === type ? "primary" : "secondary"}
            onPress={() => setSelectedType(type)}
          />
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={(text) => setNote(text.slice(0, NOTE_MAX_LENGTH))}
        placeholder="備註（選填，例如：吧台有 2 個單人座）"
        placeholderTextColor={theme.textSecondary}
        maxLength={NOTE_MAX_LENGTH}
        multiline
        style={[styles.noteInput, { borderColor: theme.border, color: theme.text }]}
      />
      <View style={styles.buttonRow}>
        <Button
          label="送出"
          variant="primary"
          disabled={submitReport.isPending || !selectedType}
          onPress={handleSubmit}
        />
        <Button label="取消" variant="secondary" onPress={() => setIsEditing(false)} />
      </View>
      {submitReport.isError && (
        <Text style={[styles.noteText, { color: theme.danger }]}>回報失敗，請稍後再試。</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: OrganicRadius.lg,
    padding: OrganicSpacing[4],
    gap: OrganicSpacing[3],
    alignItems: "flex-start",
  },
  prompt: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  noteText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  actionButton: {
    alignSelf: "flex-start",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: OrganicSpacing[2],
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[4],
    paddingVertical: OrganicSpacing[2],
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonLabel: {
    fontFamily: FontFamily.heading,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  noteInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: OrganicRadius.md,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: OrganicSpacing[2],
    fontFamily: FontFamily.body,
    fontSize: 13,
    minHeight: 56,
    textAlignVertical: "top",
  },
});
