import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import type { PlacePhoto } from "@justsolo/shared/src/server/clients/placesClient";

const photos: PlacePhoto[] = [
  { name: "places/p1/photos/a", widthPx: 100, heightPx: 100 },
  { name: "places/p1/photos/b", widthPx: 100, heightPx: 100 },
  { name: "places/p1/photos/c", widthPx: 100, heightPx: 100 },
];

describe("PhotoLightbox", () => {
  it("顯示目前 index 對應的照片", () => {
    render(
      <PhotoLightbox
        photos={photos}
        index={1}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain(
      encodeURIComponent("places/p1/photos/b"),
    );
  });

  it("第一張時不顯示上一張按鈕，最後一張時不顯示下一張按鈕", () => {
    const { rerender } = render(
      <PhotoLightbox
        photos={photos}
        index={0}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "上一張" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一張" })).toBeInTheDocument();

    rerender(
      <PhotoLightbox
        photos={photos}
        index={2}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "上一張" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下一張" })).not.toBeInTheDocument();
  });

  it("點下一張/上一張按鈕會呼叫 onNavigate", async () => {
    const onNavigate = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        index={1}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "下一張" }));
    expect(onNavigate).toHaveBeenCalledWith(2);

    await userEvent.click(screen.getByRole("button", { name: "上一張" }));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("按 Escape 會呼叫 onClose", () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        index={0}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("點背景遮罩會呼叫 onClose，點圖片本身不會", async () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        index={0}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("img"));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("點關閉按鈕會呼叫 onClose", async () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        index={0}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "關閉" }));

    expect(onClose).toHaveBeenCalled();
  });
});
