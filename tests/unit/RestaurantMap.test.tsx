import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestaurantMap } from "@/components/RestaurantMap";
import type { RestaurantMapMarker } from "@/types/restaurant";

// react-leaflet／react-leaflet-cluster 需要真實的地圖 canvas 行為，在 jsdom 裡
// 渲染容易 flaky，比照專案既有測試慣例（mock 掉會需要真實 DOM 行為的第三方元件），
// 只驗證我們自己傳給它們的 props/children 是否正確。
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position: [number, number];
  }) => (
    <div data-testid="marker" data-position={position.join(",")}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}));

vi.mock("react-leaflet-cluster", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker-cluster-group">{children}</div>
  ),
}));

const markers: RestaurantMapMarker[] = [
  { id: "r1", name: "測試燒肉店", lat: 24.15, lng: 120.68, soloSeatStatus: "CONFIRMED_YES" },
  { id: "r2", name: "測試拉麵店", lat: 24.16, lng: 120.69, soloSeatStatus: "UNKNOWN" },
];

describe("RestaurantMap", () => {
  it("依傳入的 marker 資料渲染對應數量的 Marker，含店名、狀態文字與詳情連結", () => {
    render(<RestaurantMap restaurants={markers} />);

    expect(screen.getAllByTestId("marker")).toHaveLength(2);
    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.getByText("測試拉麵店")).toBeInTheDocument();
    expect(screen.getByText("已確認有單人座位")).toBeInTheDocument();
    expect(screen.getByText("尚未確認，建議致電詢問")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "查看詳情" });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/restaurant/r1",
      "/restaurant/r2",
    ]);
  });

  it("marker 的座標對應到餐廳的 lat/lng", () => {
    render(<RestaurantMap restaurants={markers} />);

    const [first, second] = screen.getAllByTestId("marker");
    expect(first).toHaveAttribute("data-position", "24.15,120.68");
    expect(second).toHaveAttribute("data-position", "24.16,120.69");
  });

  it("沒有餐廳資料時不渲染任何 Marker", () => {
    render(<RestaurantMap restaurants={[]} />);

    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});
