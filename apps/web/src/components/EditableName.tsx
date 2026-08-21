"use client";

import { useState } from "react";
import { useUpdateUserName } from "@/hooks/useUpdateUserName";
import { useUserProfile } from "@/hooks/useUserProfile";
import { trpc } from "@/lib/trpc";

export const EditableName = () => {
  const { data: profile } = useUserProfile();
  const utils = trpc.useUtils();
  const updateName = useUpdateUserName();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <p className="font-semibold text-foreground">
          {profile?.name ?? "使用者"}
        </p>
        <button
          type="button"
          onClick={() => {
            setValue(profile?.name ?? "");
            setError(null);
            setIsEditing(true);
          }}
          className="cursor-pointer rounded-full border border-divider px-2 py-0.5 text-xs text-foreground hover:bg-foreground/5"
        >
          編輯
        </button>
      </div>
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="名稱"
          maxLength={50}
          className="rounded-full border border-divider bg-background px-3 py-1 text-sm text-foreground"
        />
        <button
          type="button"
          disabled={updateName.isPending}
          onClick={handleSave}
          className="cursor-pointer rounded-full bg-accent px-3 py-1 text-xs text-background disabled:opacity-50"
        >
          儲存
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="cursor-pointer rounded-full border border-divider px-3 py-1 text-xs text-foreground hover:bg-foreground/5"
        >
          取消
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};
