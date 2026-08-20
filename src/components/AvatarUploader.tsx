"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useUpdateUserAvatar } from "@/hooks/useUpdateUserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cropImageToDataUrl, readFileAsDataUrl } from "@/lib/imageCrop";
import { trpc } from "@/lib/trpc";
import { UserIcon } from "@/components/icons/AuthIcons";

export const AvatarUploader = () => {
  const { data: profile } = useUserProfile();
  const utils = trpc.useUtils();
  const updateAvatar = useUpdateUserAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const dataUrl = await readFileAsDataUrl(file);
    setImageSrc(dataUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    setImageSrc(null);
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
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded border border-foreground/15 px-3 py-1.5 text-xs text-foreground hover:bg-foreground/5"
      >
        上傳大頭貼
      </button>

      {error && <p className="text-xs text-danger">{error}</p>}

      {imageSrc && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 p-6">
          <div className="relative h-72 w-72 max-w-full">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_croppedArea, areaPixels) =>
                setCroppedAreaPixels(areaPixels)
              }
            />
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="縮放"
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-72 max-w-full"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="cursor-pointer rounded border border-foreground/15 bg-background px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
            >
              取消
            </button>
            <button
              type="button"
              disabled={updateAvatar.isPending}
              onClick={handleConfirm}
              className="cursor-pointer rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
            >
              確認
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
