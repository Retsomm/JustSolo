"use client";

import { useEffect, useRef } from "react";
import { buildPlacePhotoProxyUrl } from "@justsolo/shared";
import type { PlacePhoto } from "@justsolo/shared/src/server/clients/placesClient";

const LIGHTBOX_PHOTO_WIDTH_PX = 1200;

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type PhotoLightboxProps = {
  photos: PlacePhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export const PhotoLightbox = ({
  photos,
  index,
  onClose,
  onNavigate,
}: PhotoLightboxProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 開啟時記住觸發的元素（縮圖）並把焦點移進對話框；關閉（unmount）時
  // 把焦點還給原本觸發的元素，符合 dialog 的無障礙焦點管理慣例。
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) {
        onNavigate(index + 1);
      }

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
  }, [index, photos.length, onClose, onNavigate]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="照片放大檢視"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 outline-none"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="關閉"
        className="absolute right-4 top-4 cursor-pointer rounded-full bg-black/50 px-3 py-1.5 text-lg text-white hover:bg-black/70"
      >
        ✕
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="上一張"
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
        >
          ‹
        </button>
      )}

      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="下一張"
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
        >
          ›
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={buildPlacePhotoProxyUrl(photo.name, LIGHTBOX_PHOTO_WIDTH_PX)}
        alt={`餐廳照片（第 ${index + 1} 張，共 ${photos.length} 張）`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />
    </div>
  );
};
