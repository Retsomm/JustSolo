# JustSolo 開發計畫

> 產品/架構層級的規劃文件，變動不大。逐次開發的即時進度請看根目錄 `PROGRESS.md`。

## 專案定位

核心痛點：使用者（尤其 I 人/單人用餐者）常常找到「看起來好吃」的餐廳，到店才發現沒有
單人座位，或吧台位需要跟陌生人併桌。核心價值主張：把「有無單人座位」變成**第一級、
可信賴的篩選條件**，而不是要打電話問或到店碰運氣。跨所有餐飲分類（燒肉、中式、牛排、
甜點店…），不是燒肉專屬功能。MVP 地理範圍先鎖定**台中市**。

## 使用者情境模擬（BDD 驗收案例）

**主情境**
```
Given 阿明是個內向者，下班後想自己吃燒肉犒賞自己
  過去有多次「到店才發現只有 4 人桌起訂」的挫折經驗
When 他在 App 選「燒肉」分類，開啟「僅顯示有單人座位」篩選，搜尋台中市內的店
Then 結果只顯示「已確認有單人座位」的燒肉店
  每張店卡標示座位類型（吧台單人座 / 單人小桌 / 一人套餐）與資訊來源
```

**Edge case（決定資料模型設計的關鍵）**
- 資料庫沒有單人座位資訊 → 標示「未知，建議致電確認」，**不能直接排除**，否則會漏掉
  真正友善的店
- 使用者回報「這間其實有/沒有單人座位」→ 眾包修正機制，需要信心分數而非單純覆寫（Phase 2）
- 篩選維度是 cross-cutting（橫跨所有分類），不是燒肉專屬欄位

## MVP 範圍

**Must have**：餐廳 CRUD、座位資訊（tri-state：確認有/確認無/未知）、分類 + 台中市篩選、
單人座位篩選、餐廳詳情頁
**Phase 2**：眾包回報＋信心分數、地圖檢視、帳號系統、「單人用餐友善度」專屬評分
**Phase 3**：即時空位、推薦系統

## 資料模型（實作於 `prisma/schema.prisma`）

- `Category`：燒肉/中式/牛排/甜點…
- `Restaurant`：基本資料 + `soloSeatStatus`（`CONFIRMED_YES` / `CONFIRMED_NO` / `UNKNOWN`）+
  `soloSeatType`（座位類型描述）+ `soloSeatConfidence`（Phase 2 才會真正計算）
- `SoloSeatReport`：眾包回報記錄，MVP 先保留 schema、不接 UI/API

## 架構：Client / Service / Hook 分層

三層中，Client、Service 在**後端**，Hook 在**前端**：

| 層 | 位置 | 職責 | 範例 |
|---|---|---|---|
| **Client** | 後端最底層 | 純 I/O 封裝，不含業務邏輯 | `src/server/clients/prismaClient.ts` |
| **Service** | 後端 | 組合 Client、實作業務規則，純函式、FP 風格，不用真連 DB 就能單元測試 | `src/server/services/restaurantSearchService.ts` |
| **Hook** | 前端 | React custom hook，呼叫 tRPC、管理 loading/error/data | `src/hooks/useRestaurantSearch.ts` |

API 層用 tRPC：`src/server/routers/*` 定義 procedure，前端透過
`src/lib/trpc.ts`（`createTRPCReact`）＋ `src/app/providers.tsx` 取得型別安全的 client。

全程 `const foo = (...) => {...}` 箭頭函式、無 class、優先 map/filter/reduce 組合、不 mutate。

## TDD 工作流程

1. 使用者情境先寫 acceptance test（Given/When/Then，Playwright e2e）
2. Service 層寫單元測試（Vitest，因為是純函式，最好測）
3. Hook 層用 React Testing Library + Vitest + MSW mock API
4. Repository/Client 層用測試 DB 跑整合測試
5. 紅燈 → 最小實作變綠燈 → refactor

第一輪已完成的範例：`tests/unit/restaurantSearchService.test.ts` 測試
`filterAndSortBySoloSeat`（純函式，`soloSeatOnly` 篩選 + 排序邏輯）。

## 資料來源策略

Google Places API 匯入台中市各分類餐廳的基本資料（名稱/地址/座標），單人座位資訊
（`soloSeatStatus`/`soloSeatType`）MVP 階段人工補完熟悉的店家，Phase 2 再開放眾包回報。

## 決策記錄

| 決策 | 選擇 | 日期 |
|---|---|---|
| 地理範圍 | 台中市 | 2026-08-19 |
| API 設計 | tRPC | 2026-08-19 |
| MVP 帳號/眾包 | 不做（schema 保留） | 2026-08-19 |
| 資料來源 | Google Places API + 人工補完 | 2026-08-19 |
| GitHub | Retsomm/JustSolo（私有/公開視 repo 設定） | 2026-08-19 |
