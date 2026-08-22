import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn } from "next-auth/react";
import { SoloSeatReportForm } from "@/components/SoloSeatReportForm";
import { useDeleteSoloSeatReport } from "@/hooks/useDeleteSoloSeatReport";
import { useMySoloSeatReport } from "@/hooks/useMySoloSeatReport";
import { useSubmitSoloSeatReport } from "@/hooks/useSubmitSoloSeatReport";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("@/hooks/useMySoloSeatReport");
vi.mock("@/hooks/useSubmitSoloSeatReport");
vi.mock("@/hooks/useDeleteSoloSeatReport");

const restaurantInvalidate = vi.fn();
const favoriteListInvalidate = vi.fn();
const getMineInvalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      restaurant: { invalidate: restaurantInvalidate },
      favorite: { list: { invalidate: favoriteListInvalidate } },
      soloSeatReport: { getMine: { invalidate: getMineInvalidate } },
    })),
  },
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseMySoloSeatReport = vi.mocked(useMySoloSeatReport);
const mockedUseSubmitSoloSeatReport = vi.mocked(useSubmitSoloSeatReport);
const mockedUseDeleteSoloSeatReport = vi.mocked(useDeleteSoloSeatReport);

const authenticatedSession = {
  data: { user: { name: "小明" } },
  status: "authenticated",
} as unknown as ReturnType<typeof useSession>;

describe("SoloSeatReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);
    mockedUseDeleteSoloSeatReport.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteSoloSeatReport>);
  });

  it("未登入時顯示登入提示，不顯示回報入口", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);

    expect(
      screen.getByText("登入後即可回報這間餐廳是否有單人座位。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "新增回報" }),
    ).not.toBeInTheDocument();
  });

  it("未登入時點擊登入按鈕會呼叫 signIn(\"google\")", async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入但尚未回報過時顯示「新增回報」，點擊後才出現選項與備註欄", async () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);

    expect(
      screen.queryByRole("button", { name: "有單人座位" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "刪除" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "新增回報" }));

    expect(screen.getByRole("button", { name: "有單人座位" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "送出" })).toBeDisabled();
  });

  it("新增回報：選擇「有單人座位」＋填備註後按送出才會送出，成功後 invalidate 整個 restaurant router、favorite.list 與自己的回報快取", async () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "新增回報" }));
    await userEvent.click(screen.getByRole("button", { name: "有單人座位" }));
    await userEvent.type(
      screen.getByPlaceholderText(/備註/),
      "吧台有 2 個單人座",
    );
    await userEvent.click(screen.getByRole("button", { name: "送出" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        restaurantId: "r1",
        reportType: "CONFIRMED_YES",
        note: "吧台有 2 個單人座",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(restaurantInvalidate).toHaveBeenCalled();
    expect(favoriteListInvalidate).toHaveBeenCalled();
    expect(getMineInvalidate).toHaveBeenCalledWith({ restaurantId: "r1" });
  });

  it("已經回報過時顯示唯讀摘要（含備註），不會因為畫面重新整理就消失", () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: { reportType: "CONFIRMED_NO", note: "只有兩人以上的桌" },
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);

    expect(screen.getByText("你回報：沒有單人座位")).toBeInTheDocument();
    expect(screen.getByText("備註：只有兩人以上的桌")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "編輯" })).toBeInTheDocument();
  });

  it("點擊「編輯」會用既有回報預填選項與備註，改選後送出會用新的值", async () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: { reportType: "CONFIRMED_NO", note: "只有兩人以上的桌" },
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    const mutate = vi.fn();
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));

    expect(screen.getByPlaceholderText(/備註/)).toHaveValue("只有兩人以上的桌");

    await userEvent.click(screen.getByRole("button", { name: "有單人座位" }));
    await userEvent.click(screen.getByRole("button", { name: "送出" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        restaurantId: "r1",
        reportType: "CONFIRMED_YES",
        note: "只有兩人以上的桌",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("編輯中點擊「取消」會退回唯讀摘要，不會送出", async () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: { reportType: "CONFIRMED_YES", note: null },
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    const mutate = vi.fn();
    mockedUseSubmitSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSubmitSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "編輯" }));
    await userEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText("你回報：有單人座位")).toBeInTheDocument();
  });

  it("已經回報過時可以點「刪除」，成功後 invalidate 整個 restaurant router、favorite.list 與自己的回報快取", async () => {
    mockedUseSession.mockReturnValue(authenticatedSession);
    mockedUseMySoloSeatReport.mockReturnValue({
      data: { reportType: "CONFIRMED_YES", note: null },
    } as unknown as ReturnType<typeof useMySoloSeatReport>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseDeleteSoloSeatReport.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteSoloSeatReport>);

    render(<SoloSeatReportForm restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "刪除" }));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(restaurantInvalidate).toHaveBeenCalled();
    expect(favoriteListInvalidate).toHaveBeenCalled();
    expect(getMineInvalidate).toHaveBeenCalledWith({ restaurantId: "r1" });
  });
});
