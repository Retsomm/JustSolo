import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableName } from "@/components/EditableName";
import { useUpdateUserName } from "@/hooks/useUpdateUserName";
import { useUserProfile } from "@/hooks/useUserProfile";

vi.mock("@/hooks/useUpdateUserName");
vi.mock("@/hooks/useUserProfile");

const getProfileInvalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      user: { getProfile: { invalidate: getProfileInvalidate } },
    })),
  },
}));

const mockedUseUpdateUserName = vi.mocked(useUpdateUserName);
const mockedUseUserProfile = vi.mocked(useUserProfile);

describe("EditableName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseUserProfile.mockReturnValue({
      data: { name: "小明", image: null },
    } as unknown as ReturnType<typeof useUserProfile>);
    mockedUseUpdateUserName.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserName>);
  });

  it("預設顯示目前名稱與「編輯」按鈕，沒有輸入框", () => {
    render(<EditableName showEditButton />);

    expect(screen.getByText("小明")).toBeInTheDocument();
    expect(screen.queryByLabelText("名稱")).not.toBeInTheDocument();
  });

  it("showEditButton 為 false 時不顯示「編輯」按鈕", () => {
    render(<EditableName showEditButton={false} />);

    expect(
      screen.queryByRole("button", { name: "編輯" }),
    ).not.toBeInTheDocument();
  });

  it("點擊「編輯」後顯示輸入框，帶入目前名稱", async () => {
    render(<EditableName showEditButton />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));

    expect(screen.getByLabelText("名稱")).toHaveValue("小明");
  });

  it("儲存空白名稱時顯示錯誤訊息，不會呼叫 mutation", async () => {
    const mutate = vi.fn();
    mockedUseUpdateUserName.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserName>);

    render(<EditableName showEditButton />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));
    await userEvent.clear(screen.getByLabelText("名稱"));
    await userEvent.click(screen.getByRole("button", { name: "儲存" }));

    expect(screen.getByText("名稱不能是空白")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("儲存成功時呼叫 updateName mutation、invalidate user.getProfile，並退出編輯模式", async () => {
    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseUpdateUserName.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserName>);

    render(<EditableName showEditButton />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));
    await userEvent.clear(screen.getByLabelText("名稱"));
    await userEvent.type(screen.getByLabelText("名稱"), "小華");
    await userEvent.click(screen.getByRole("button", { name: "儲存" }));

    expect(mutate).toHaveBeenCalledWith(
      { name: "小華" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(getProfileInvalidate).toHaveBeenCalled();
    expect(screen.queryByLabelText("名稱")).not.toBeInTheDocument();
  });

  it("點擊「取消」會退出編輯模式，不呼叫 mutation", async () => {
    const mutate = vi.fn();
    mockedUseUpdateUserName.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserName>);

    render(<EditableName showEditButton />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));
    await userEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.queryByLabelText("名稱")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
