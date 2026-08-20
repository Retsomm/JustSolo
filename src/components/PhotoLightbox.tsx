"use client";

import { useEffect } from "react";
import { buildPlacePhotoProxyUrl } from "@/lib/placePhotoUrl";
import type { PlacePhoto } from "@/server/clients/placesClient";

const LIGHTBOX_PHOTO_WIDTH_PX = 1200;

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) {
        onNavigate(index + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, photos.length, onClose, onNavigate]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="照片放大檢視"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
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
