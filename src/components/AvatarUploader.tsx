"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useUpdateUserAvatar } from "@/hooks/useUpdateUserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cropImageToDataUrl, readFileAsDataUrl } from "@/lib/imageCrop";
import { trpc } from "@/lib/trpc";
import { UserIcon } from "@/components/icons/AuthIcons";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type CropDialogProps = {
  imageSrc: string;
  crop: { x: number; y: number };
  zoom: number;
  error: string | null;
  isPending: boolean;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onCancel: () => void;
  onConfirm: () => void;
  restoreFocusRef: React.RefObject<HTMLButtonElement | null>;
};

// 比照 PhotoLightbox 的無障礙對話框慣例：role="dialog" + aria-modal，開啟時把
// 焦點移進對話框、Tab 鍵在對話框內循環，unmount（取消/確認關閉）時把焦點還給
// 觸發上傳的按鈕。裁切彈窗開啟前的焦點停在隱藏的 <input type="file">（原生選檔
// 對話框關閉後瀏覽器會把焦點還給它），不適合當作「還原焦點」的目標，所以直接
// 記住上傳按鈕的 ref，而不是像 PhotoLightbox 那樣記錄當下的 activeElement。
const CropDialog = ({
  imageSrc,
  crop,
  zoom,
  error,
  isPending,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onCancel,
  onConfirm,
  restoreFocusRef,
}: CropDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restoreTarget = restoreFocusRef.current;
    dialogRef.current?.focus();

    return () => {
      restoreTarget?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="裁切大頭貼"
      tabIndex={-1}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 outline-none"
    >
      <div className="relative h-72 w-72 max-w-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropComplete}
        />
      </div>

      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        aria-label="縮放"
        onChange={(event) => onZoomChange(Number(event.target.value))}
        className="w-72 max-w-full"
      />

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded border border-foreground/15 bg-background px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
        >
          取消
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="cursor-pointer rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
        >
          確認
        </button>
      </div>
    </div>
  );
};

export const AvatarUploader = () => {
  const { data: profile } = useUserProfile();
  const utils = trpc.useUtils();
  const updateAvatar = useUpdateUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch {
      setError("上傳失敗，請稍後再試。");
    }
  };

  const handleCancel = () => {
    setImageSrc(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setError(null);
    try {
      const output = await cropImageToDataUrl(imageSrc, croppedAreaPixels);
      updateAvatar.mutate(
        { image: output },
        {
          onSuccess: async () => {
            await utils.user.getProfile.invalidate();
            setImageSrc(null);
          },
          onError: () => setError("上傳失敗，請稍後再試。"),
        },
      );
    } catch {
      setError("裁切失敗，請重新選擇圖片。");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      {profile?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.image}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
        />
      ) : (
        <UserIcon className="h-16 w-16 shrink-0 rounded-full border border-foreground/15 p-3 text-foreground/60" />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="上傳大頭貼"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        ref={uploadButtonRef}
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded border border-foreground/15 px-3 py-1.5 text-xs text-foreground hover:bg-foreground/5"
      >
        上傳大頭貼
      </button>

      {error && !imageSrc && <p className="text-xs text-danger">{error}</p>}

      {imageSrc && (
        <CropDialog
          imageSrc={imageSrc}
          crop={crop}
          zoom={zoom}
          error={error}
          isPending={updateAvatar.isPending}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_croppedArea, areaPixels) =>
            setCroppedAreaPixels(areaPixels)
          }
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          restoreFocusRef={uploadButtonRef}
        />
      )}
    </div>
  );
};
