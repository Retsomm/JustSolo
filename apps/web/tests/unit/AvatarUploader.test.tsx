import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUploader } from "@/components/AvatarUploader";
import { useUpdateUserAvatar } from "@/hooks/useUpdateUserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cropImageToDataUrl, readFileAsDataUrl } from "@/lib/imageCrop";

vi.mock("@/hooks/useUpdateUserAvatar");
vi.mock("@/hooks/useUserProfile");

vi.mock("@/lib/imageCrop", () => ({
  readFileAsDataUrl: vi.fn(),
  cropImageToDataUrl: vi.fn(),
}));

const getProfileInvalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      user: { getProfile: { invalidate: getProfileInvalidate } },
    })),
  },
}));

type MockCropperStubProps = {
  onCropComplete?: (
    croppedArea: unknown,
    croppedAreaPixels: { x: number; y: number; width: number; height: number },
  ) => void;
};

// react-easy-crop 的實際互動（拖曳/縮放手勢）需要真的量測 DOM 版面，jsdom 沒有版面引擎，
// 比照 RestaurantMap.test.tsx mock react-leaflet 的既有慣例：用一個 stub 取代，
// mount 後立刻回呼 onCropComplete 模擬使用者已經選好裁切區域。定義寫在 vi.mock 工廠函式
// 內部（不是另外宣告一個外部 const 再參照進來）：vi.mock 會被 hoist 到檔案最上面，
// 若參照的是後面才宣告的外部 const，執行當下那個 const 還沒初始化會直接噴錯。
vi.mock("react-easy-crop", () => {
  const MockCropperStub = ({ onCropComplete }: MockCropperStubProps) => {
    useEffect(() => {
      onCropComplete?.(
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 1, y: 2, width: 100, height: 100 },
      );
      // 只需要在掛載時觸發一次；onCropComplete 是父層每次 render 都重新建立的
      // inline callback，放進 deps 會讓這個 effect 無限重跑。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="cropper-stub" />;
  };

  return { default: MockCropperStub };
});

const mockedUseUpdateUserAvatar = vi.mocked(useUpdateUserAvatar);
const mockedUseUserProfile = vi.mocked(useUserProfile);
const mockedReadFileAsDataUrl = vi.mocked(readFileAsDataUrl);
const mockedCropImageToDataUrl = vi.mocked(cropImageToDataUrl);

const selectAvatarFile = async () => {
  const file = new File(["fake"], "avatar.png", { type: "image/png" });
  await userEvent.upload(screen.getByLabelText("上傳大頭貼"), file);
};

describe("AvatarUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseUpdateUserAvatar.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserAvatar>);
    mockedUseUserProfile.mockReturnValue({
      data: { name: "小明", image: null },
    } as unknown as ReturnType<typeof useUserProfile>);
  });

  it("沒有大頭貼時顯示預設圖示，不顯示裁切彈窗", () => {
    render(<AvatarUploader />);

    expect(screen.queryByTestId("cropper-stub")).not.toBeInTheDocument();
  });

  it("選擇檔案後開啟裁切彈窗（顯示 Cropper、縮放滑桿、確認/取消按鈕）", async () => {
    mockedReadFileAsDataUrl.mockResolvedValue("data:image/png;base64,orig");

    render(<AvatarUploader />);
    await selectAvatarFile();

    expect(screen.getByTestId("cropper-stub")).toBeInTheDocument();
    expect(screen.getByLabelText("縮放")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確認" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("點擊「取消」會關閉裁切彈窗，不呼叫 mutation", async () => {
    mockedReadFileAsDataUrl.mockResolvedValue("data:image/png;base64,orig");
    const mutate = vi.fn();
    mockedUseUpdateUserAvatar.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserAvatar>);

    render(<AvatarUploader />);
    await selectAvatarFile();
    await userEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByTestId("cropper-stub")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("點擊「確認」會裁切圖片並呼叫 updateAvatar mutation，成功後 invalidate user.getProfile 並關閉彈窗", async () => {
    mockedReadFileAsDataUrl.mockResolvedValue("data:image/png;base64,orig");
    mockedCropImageToDataUrl.mockResolvedValue("data:image/jpeg;base64,cropped");

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseUpdateUserAvatar.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserAvatar>);

    render(<AvatarUploader />);
    await selectAvatarFile();
    await userEvent.click(screen.getByRole("button", { name: "確認" }));

    expect(mockedCropImageToDataUrl).toHaveBeenCalledWith(
      "data:image/png;base64,orig",
      { x: 1, y: 2, width: 100, height: 100 },
    );
    expect(mutate).toHaveBeenCalledWith(
      { image: "data:image/jpeg;base64,cropped" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(getProfileInvalidate).toHaveBeenCalled();
    expect(screen.queryByTestId("cropper-stub")).not.toBeInTheDocument();
  });

  it("已有大頭貼時顯示現有的圖片", () => {
    mockedUseUserProfile.mockReturnValue({
      data: { name: "小明", image: "https://example.com/avatar.jpg" },
    } as unknown as ReturnType<typeof useUserProfile>);

    render(<AvatarUploader />);

    // alt="" 是刻意的（大頭貼是裝飾性圖片，旁邊沒有文字說明它是誰），accessibility
    // role 因此是 "presentation" 不是 "img"。
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://example.com/avatar.jpg",
    );
  });
});
