import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn } from "next-auth/react";
import { SoloSeatReportForm } from "@/components/SoloSeatReportForm";
import { useSubmitSoloSeatReport } from "@/hooks/useSubmitSoloSeatReport";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("@/hooks/useSubmitSoloSeatReport");

const invalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      restaurant: { getById: { invalidate } },
    })),
  },
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseSubmitSoloSeatReport = vi.mocked(useSubmitSoloSeatReport);

describe("SoloSeatReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登入時顯示登入提示，不顯示回報按鈕", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);

    render(<SoloSeatReportForm restaurantId="r1" />);

    expect(
      screen.getByText("登入後即可回報這間餐廳是否有單人座位。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "有單人座位" }),
    ).not.toBeInTheDocument();
  });

  it("未登入時點擊登入按鈕會呼叫 signIn(\"google\")", async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入時點擊「有單人座位」會送出正確參數，成功後清空備註並 invalidate 詳情頁快取", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.type(
      screen.getByPlaceholderText(/備註/),
      "吧台有 2 個單人座",
    );
    await userEvent.click(screen.getByRole("button", { name: "有單人座位" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        restaurantId: "r1",
        reportType: "CONFIRMED_YES",
        note: "吧台有 2 個單人座",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(invalidate).toHaveBeenCalledWith({ id: "r1" });
  });

  it("已登入時點擊「沒有單人座位」會送出 CONFIRMED_NO", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);

    const mutate = vi.fn();
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(
      screen.getByRole("button", { name: "沒有單人座位" }),
    );

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1", reportType: "CONFIRMED_NO", note: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
