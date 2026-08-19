# JustSolo 開發進度追蹤

> 這份文件是跨對話的進度對照表。每次開新對話接續開發前，先讀這份文件，
> 不要重新從零規劃。完成一個項目就更新狀態，不要等到最後才補。

## 專案一句話說明

一人友善餐廳搜尋 App。核心價值：把「有無單人座位」變成第一級可篩選、可信賴的資訊，
不限燒肉，涵蓋所有餐飲分類（中式、牛排、甜點…）。MVP 地理範圍先鎖定**台中市**。

## 技術棧決策（已定案，不要重新討論）

| 項目 | 決定 |
|---|---|
| 框架 | Next.js (App Router) + TypeScript + React |
| 樣式 | Tailwind CSS |
| 後端架構 | Client / Service / Hook 三層（Client、Service 在後端；Hook 在前端） |
| API | tRPC（型別從 Service 直接共用到前端 Hook） |
| 資料庫 | PostgreSQL + Prisma（Prisma 7，`prisma-client` generator，需要 driver adapter） |
| 程式風格 | `const foo = (...) => {...}` 箭頭函式、FP 風格、無 class、避免 mutate |
| 套件管理 | **yarn**（2026-08-19 補充決定，原本 scaffold 誤用 npm，已改用 yarn，`yarn.lock` 為準） |
| 測試 | Vitest（單元/整合）+ React Testing Library + Playwright（e2e）+ MSW |
| 資料來源 | Google Places API 匯入基本資料 + 人工補完單人座位資訊（尚未申請 API Key） |
| MVP 範圍 | 不做帳號系統/眾包回報 UI（schema 已保留 `SoloSeatReport` 供 Phase 2） |
| GitHub | https://github.com/Retsomm/JustSolo.git |
| 本機路徑 | `~/Projects/JustSolo` |

## 進度對照表

| 項目 | 狀態 | 備註 |
|---|---|---|
| Next.js + TS + Tailwind scaffold | ✅ 完成 | `create-next-app`，App Router，`src/` 目錄 |
| Prisma + 本機 PostgreSQL | ✅ 完成 | 本機 DB `justsolo_db`（`createdb` 建立，trust auth 免密碼） |
| Prisma schema（Restaurant/Category/SoloSeatReport） | ✅ 完成 | 見 `prisma/schema.prisma`，已跑過 `init` migration |
| tRPC 串接（router/route handler/client provider） | ✅ 完成 | 已用 curl 驗證 GET 查詢能打通 Service→Client→DB，回傳空陣列（尚無資料） |
| Client/Service/Hook 分層骨架 | ✅ 完成 | `src/server/clients`、`src/server/services`、`src/hooks` |
| 第一個 TDD 測試（`filterAndSortBySoloSeat`） | ✅ 完成 | `tests/unit/restaurantSearchService.test.ts`，3 個測試全過 |
| Vitest / Playwright 設定 | ✅ 完成 | Vitest 已驗證可跑；**Playwright 瀏覽器尚未 `yarn playwright install`**，e2e 還不能真的跑 |
| 套件管理改用 yarn | ✅ 完成 | 已刪 `package-lock.json`／`node_modules`，改 `yarn install` 產生 `yarn.lock`；`playwright.config.ts` 的 `webServer.command` 已改 `yarn dev` |
| GitHub remote + 首次 push | ✅ 完成 | `origin` = Retsomm/JustSolo，`main` 已 push |
| 首頁 UI（實際串 `useRestaurantSearch`） | 🔲 未開始 | 目前 `/` 還是 create-next-app 預設頁面，**不是功能開發，只是環境建置** |
| Google Places API 匯入台中市種子資料 | 🔲 未開始 | 需要先申請 API Key；`scripts/import-restaurants.ts` 待寫，`placesClient.ts` 是 stub |
| 使用者帳號/眾包回報 UI | 🔲 未開始（Phase 2） | schema 已預留，MVP 刻意不做 |
| 地圖檢視 | 🔲 未開始（Phase 2） | |

## 已知的坑（環境建置時踩過，未來不要重踩）

1. **Prisma 7 的 `prisma-client` generator 沒有 `index.ts`，主要入口是 `client.ts`**：
   要 `import { PrismaClient } from "@/generated/prisma/client"`，不是 `"@/generated/prisma"`。
2. **Prisma 7 要求顯式 driver adapter**：直接 `new PrismaClient()`（不帶 `adapter`）會丟
   `PrismaClientInitializationError`。要用 `@prisma/adapter-pg` 的 `PrismaPg`，見
   `src/server/clients/prismaClient.ts`。
3. **PrismaClient 不能在 module 頂層直接建立**：因為 Service 層在 module 頂層 import Client 層，
   若 Client 層頂層就 `new PrismaClient()`，連只測 `filterAndSortBySoloSeat`（純函式、完全不碰 DB）
   的單元測試都會因為 transitively import 到而炸掉。已改成 `getPrisma()` lazy singleton 寫法。
4. `npx prisma generate` 不會在 `npm install`/`yarn install` 自動跑，除非有 `postinstall`
   script——已加到 `package.json`，其他機器 clone 下來 `yarn install` 後應該會自動生成，
   若沒有就手動跑一次 `yarn prisma generate`。
5. `create-next-app` 的專案名稱不能有大寫字母（npm 命名限制），本機資料夾/GitHub repo 都叫
   `JustSolo`，但 `package.json` 的 `name` 欄位是小寫 `justsolo`，這是刻意的，不是打錯。
6. `vitest.config.ts` 若專案沒設 `"type": "module"`，Vite 的 native config loader 會警告 ESM/CJS
   混用——已改用 `.mts` 副檔名＋`import.meta.dirname`（而非 `__dirname`）解決，未來加其他 config
   檔案（例如 `playwright.config.ts`）如果也出現同樣警告，比照辦理。
7. **套件管理工具是 yarn，不是 npm**：一開始 scaffold 忘記問清楚，用 `create-next-app` 預設的
   npm 建了 `package-lock.json`，2026-08-19 使用者提醒後改用 yarn（刪掉 `package-lock.json`
   跟 `node_modules`，重新 `yarn install`）。往後看到任何指令範例、CI 設定、文件，一律用
   `yarn xxx`，不要用 `npm run xxx`/`npx xxx`——尤其 `playwright.config.ts` 的
   `webServer.command` 這種容易被忽略的地方也要記得改。

## 下次接續開發時，建議的下一步（依優先序）

1. 申請 Google Places API Key，把 `.env` 加上 `GOOGLE_PLACES_API_KEY`（不要 commit）
2. 實作 `placesClient.ts` 的 `searchPlacesByCategory`，寫 `scripts/import-restaurants.ts`
   匯入台中市燒肉/中式/牛排/甜點店基本資料（`soloSeatStatus` 先全部 `UNKNOWN`）
3. 手動標註前 10-20 間熟悉的店的 `soloSeatStatus`/`soloSeatType`，作為第一批可信資料
4. 做首頁 UI：分類篩選＋「僅顯示有單人座位」開關＋店卡列表，串 `useRestaurantSearch`
5. 補 acceptance test（Playwright e2e，對應主情境：燒肉＋單人座位篩選）
6. `yarn playwright install` 後才能真的跑 e2e

## 給接手對話的 AI 模型的提醒

- **這份文件跟 `docs/PLAN.md` 分工不同**：`docs/PLAN.md` 是完整的產品/架構規劃文件
  （情境模擬、資料模型設計理由、Phase 劃分），**變動不大**；這份 `PROGRESS.md` 才是每次
  對話都要更新的「現在做到哪」對照表。改完進度記得回來更新這裡的狀態欄位。
- 依照使用者全域規則：**沒有使用者親自驗證過的修改，不要主動 `git commit`**。這次環境建置
  （scaffold/設定檔/schema/測試骨架）全部都能在本環境驗證（build/test/typecheck/curl 都跑過），
  所以可以直接 commit+push；但之後一旦動到**需要使用者用瀏覽器實際操作確認的 UI 功能**，
  改完要停在工作目錄，等使用者說「測試 OK」才能 commit。
