"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useDeleteSoloSeatReport } from "@/hooks/useDeleteSoloSeatReport";
import { useMySoloSeatReport } from "@/hooks/useMySoloSeatReport";
import { useSubmitSoloSeatReport } from "@/hooks/useSubmitSoloSeatReport";
import { trpc } from "@/lib/trpc";

type SoloSeatReportFormProps = {
  restaurantId: string;
};

type ReportType = "CONFIRMED_YES" | "CONFIRMED_NO";

const NOTE_MAX_LENGTH = 200;

const reportTypeLabel: Record<ReportType, string> = {
  CONFIRMED_YES: "有單人座位",
  CONFIRMED_NO: "沒有單人座位",
};

// 唯讀摘要＋編輯按鈕→表單＋送出/取消，比照 EditableName.tsx 的互動模式：
// 「有/沒有單人座位」不再是點了就直接送出的按鈕，而是編輯表單裡的選項，
// 一定要按下送出才會真的改變信心分數；使用者自己填過的備註也會保留在唯讀
// 摘要裡持續顯示，不會送出後就從畫面上消失。
export const SoloSeatReportForm = ({
  restaurantId,
}: SoloSeatReportFormProps) => {
  const { status } = useSession();
  const utils = trpc.useUtils();
  const { data: myReport } = useMySoloSeatReport(restaurantId);
  const submitReport = useSubmitSoloSeatReport();
  const deleteReport = useDeleteSoloSeatReport();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [note, setNote] = useState("");

  if (status !== "authenticated") {
    return (
      <section className="flex flex-col gap-2 rounded-3xl border border-divider bg-surface p-4">
        <p className="text-sm text-foreground/70">
          登入後即可回報這間餐廳是否有單人座位。
        </p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="cursor-pointer self-start rounded-full border border-divider px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
        >
          登入
        </button>
      </section>
    );
  }

  const startEditing = () => {
    setSelectedType(myReport?.reportType ?? null);
    setNote(myReport?.note ?? "");
    setIsEditing(true);
  };

  // 新增/編輯/刪除回報都會改變這間餐廳的 soloSeatStatus/soloSeatConfidence，
  // 這兩個欄位不是只出現在 restaurant.getById（詳情頁），首頁的推薦卡片
  // （restaurant.pickOne）、完整列表（restaurant.search）、地圖（mapMarkers）、
  // 「我的收藏」清單（favorite.list）都各自快取了同一間餐廳的這兩個欄位。
  // 之前只 invalidate restaurant.getById，導致回報成功後只有詳情頁本身更新，
  // 使用者切回首頁還是看到回報前的舊信心分數——這裡改成用 tRPC React Query
  // 的 router 層級 invalidate（呼叫 utils.restaurant.invalidate() 會連帶
  // invalidate 底下所有 procedure 的快取，不用每個查詢各自手動列一次）讓所有
  // 顯示同一間餐廳資料的畫面在下次聚焦/重新掛載時都拿到最新聚合結果。
  const invalidateAfterReportChange = () => {
    utils.restaurant.invalidate();
    utils.favorite.list.invalidate();
    utils.soloSeatReport.getMine.invalidate({ restaurantId });
  };

  const handleDelete = () => {
    deleteReport.mutate(
      { restaurantId },
      {
        onSuccess: () => {
          invalidateAfterReportChange();
        },
      },
    );
  };

  if (!isEditing) {
    return (
      <section className="flex flex-col gap-2 rounded-3xl border border-divider bg-surface p-4">
        {myReport ? (
          <>
            <p className="text-sm text-foreground">
              你回報：{reportTypeLabel[myReport.reportType]}
            </p>
            {myReport.note && (
              <p className="text-sm text-foreground/70">備註：{myReport.note}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-foreground">這間餐廳有單人座位嗎？</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startEditing}
            className="cursor-pointer self-start rounded-full border border-divider px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
          >
            {myReport ? "編輯" : "新增回報"}
          </button>
          {myReport && (
            <button
              type="button"
              disabled={deleteReport.isPending}
              onClick={handleDelete}
              className="cursor-pointer self-start rounded-full border border-divider px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              刪除
            </button>
          )}
        </div>
        {deleteReport.isError && (
          <p className="text-sm text-foreground/70">刪除失敗，請稍後再試。</p>
        )}
      </section>
    );
  }

  const handleSubmit = () => {
    if (!selectedType) return;

    submitReport.mutate(
      { restaurantId, reportType: selectedType, note: note.trim() || undefined },
      {
        onSuccess: () => {
          invalidateAfterReportChange();
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-divider bg-surface p-4">
      <p className="text-sm text-foreground">這間餐廳有單人座位嗎？</p>
      <div className="flex gap-2">
        {(["CONFIRMED_YES", "CONFIRMED_NO"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={
              selectedType === type
                ? "cursor-pointer rounded-full bg-accent px-3 py-1.5 text-sm text-background"
                : "cursor-pointer rounded-full border border-divider px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
            }
          >
            {reportTypeLabel[type]}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
        placeholder="備註（選填，例如：吧台有 2 個單人座）"
        maxLength={NOTE_MAX_LENGTH}
        className="rounded-2xl border border-divider bg-background p-2 text-sm text-foreground placeholder:text-foreground/40"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={submitReport.isPending || !selectedType}
          onClick={handleSubmit}
          className="cursor-pointer rounded-full bg-accent px-3 py-1.5 text-sm text-background hover:bg-(--color-accent-600) disabled:opacity-50"
        >
          送出
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="cursor-pointer rounded-full border border-divider px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
        >
          取消
        </button>
      </div>
      {submitReport.isError && (
        <p className="text-sm text-foreground/70">回報失敗，請稍後再試。</p>
      )}
    </section>
  );
};
