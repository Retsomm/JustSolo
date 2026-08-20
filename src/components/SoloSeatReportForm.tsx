"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSubmitSoloSeatReport } from "@/hooks/useSubmitSoloSeatReport";
import { trpc } from "@/lib/trpc";

type SoloSeatReportFormProps = {
  restaurantId: string;
};

const NOTE_MAX_LENGTH = 200;

export const SoloSeatReportForm = ({
  restaurantId,
}: SoloSeatReportFormProps) => {
  const { status } = useSession();
  const utils = trpc.useUtils();
  const submitReport = useSubmitSoloSeatReport();
  const [note, setNote] = useState("");

  if (status !== "authenticated") {
    return (
      <section className="flex flex-col gap-2 rounded border border-foreground/15 p-4">
        <p className="text-sm text-foreground/70">
          登入後即可回報這間餐廳是否有單人座位。
        </p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="cursor-pointer self-start rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
        >
          登入
        </button>
      </section>
    );
  }

  const handleSubmit = (reportType: "CONFIRMED_YES" | "CONFIRMED_NO") => {
    submitReport.mutate(
      { restaurantId, reportType, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote("");
          utils.restaurant.getById.invalidate({ id: restaurantId });
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-2 rounded border border-foreground/15 p-4">
      <p className="text-sm text-foreground">這間餐廳有單人座位嗎？</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={submitReport.isPending}
          onClick={() => handleSubmit("CONFIRMED_YES")}
          className="cursor-pointer rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 disabled:opacity-50"
        >
          有單人座位
        </button>
        <button
          type="button"
          disabled={submitReport.isPending}
          onClick={() => handleSubmit("CONFIRMED_NO")}
          className="cursor-pointer rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 disabled:opacity-50"
        >
          沒有單人座位
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
        placeholder="備註（選填，例如：吧台有 2 個單人座）"
        maxLength={NOTE_MAX_LENGTH}
        className="rounded border border-foreground/15 bg-background p-2 text-sm text-foreground placeholder:text-foreground/40"
        rows={2}
      />
      {submitReport.isError && (
        <p className="text-sm text-foreground/70">回報失敗，請稍後再試。</p>
      )}
    </section>
  );
};
