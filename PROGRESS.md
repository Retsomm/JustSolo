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
| Git 分支策略 | **2026-08-19 起：所有變更 push 到 `dev` branch（不推 `main`），觸發 CodeRabbit code review** |
| 推送前驗證方式 | **2026-08-19 起：Claude 不用自己跑 dev server/curl/完整 build 驗證，使用者會自己本機測試**；TDD 單元測試（`yarn test`）跟 typecheck 照跑，這是寫程式過程的一部分，不是額外驗證 |

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
| `dev` branch 建立 + push | ✅ 完成 | `origin/dev` 已建立，之後開發都在這個 branch 上 |
| `placesClient.ts` 真正實作（Google Places API Text Search） | ✅ 完成，已實測 | 純函式 `buildTextSearchQuery`/`parsePlacesResponse` 有單元測試；2026-08-19 使用者提供 `GOOGLE_PLACE_NEW_API_KEY` 後已實際打過 Google 的伺服器，成功 |
| `scripts/import-restaurants.ts` 匯入腳本 | ✅ 完成，已實測 | `yarn import:restaurants` 已實際跑過：燒肉/中式/牛排/甜點各匯入 20 筆，共 80 筆台中市真實店家 |
| Google Places API 台中市種子資料真正匯入 DB | ✅ 完成 | 已用 `psql` 驗證：4 分類各 20 筆，`soloSeatStatus` 皆為 `UNKNOWN`（符合預期，等人工標註） |
| `category.list` tRPC procedure | ✅ 完成 | `src/server/routers/category.ts`，給首頁分類下拉選單用 |
| 首頁 UI（分類篩選＋單人座位開關＋餐廳卡片列表） | ✅ 完成程式碼，⏸ **未在瀏覽器實際看過** | `src/app/page.tsx`；component test（`tests/unit/HomePage.test.tsx`，mock 掉 Hook 層）4 個測試全過；**沒有跑過 `yarn dev` 用瀏覽器肉眼確認過畫面**，按照 2026-08-19 的推送流程，這一步留給使用者本機驗證 |
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
8. **Google Places API Key 的環境變數名稱是 `GOOGLE_PLACE_NEW_API_KEY`（單數 PLACE + NEW），
   不是文法上更順的 `GOOGLE_PLACES_API_KEY`**：Claude 一開始寫程式碼時用了後者（複數），
   使用者實際在 `.env` 設定時用的是前者，2026-08-19 已把 `placesClient.ts`／`.env.example`
   統一改成使用者實際設定的名稱。以 `.env` 裡使用者真正寫的變數名為準，不要自己「修正」成
   看起來更標準的名稱。
9. **`.gitignore` 的 `.env*` 規則會連 `.env.example` 一起排除**：`.env.example` 從一開始建立
   就沒被 git 追蹤到，`git status` 也不會顯示成「未追蹤」（因為被 ignore 規則吃掉，不是單純沒
   `git add`），一直到 2026-08-19 才發現它從沒被 push 上 GitHub。已在 `.gitignore` 加一行
   `!.env.example` 排除規則修正。**教訓**：`.env*` 這種萬用字元規則要小心會不會誤殺明確想要
   commit 的範例檔案，之後新增任何「範例/模板」性質的 env 檔案，記得檢查 `git status --ignored`
   確認真的有被追蹤到，不要只憑感覺以為 `.env.example` 這種常見檔名會自動被放行。

## 下次接續開發時，建議的下一步（依優先序）

1. ~~申請 Google Places API Key、匯入台中市種子資料~~ ✅ 2026-08-19 完成，DB 已有 80 筆真實店家
2. ~~做首頁 UI~~ ✅ 2026-08-19 程式碼完成，**使用者接手：`yarn dev` 打開 http://localhost:3000
   實際看一次畫面**，這是目前唯一「有前端可以驗證」的東西
3. 手動標註前 10-20 間熟悉的店的 `soloSeatStatus`/`soloSeatType`，作為第一批可信資料
   （目前 80 筆全是 `UNKNOWN`，篩選「僅顯示有單人座位」現在測起來會是空結果，這是預期的，
   不是 bug——可以先用 Prisma Studio `yarn db:studio` 手動改幾筆來測 UI）
4. 補 acceptance test（Playwright e2e，對應主情境：燒肉＋單人座位篩選）
5. `yarn playwright install` 後才能真的跑 e2e

## 給接手對話的 AI 模型的提醒

- **這份文件跟 `docs/PLAN.md` 分工不同**：`docs/PLAN.md` 是完整的產品/架構規劃文件
  （情境模擬、資料模型設計理由、Phase 劃分），**變動不大**；這份 `PROGRESS.md` 才是每次
  對話都要更新的「現在做到哪」對照表。改完進度記得回來更新這裡的狀態欄位。
- 依照使用者全域規則：**沒有使用者親自驗證過的修改，不要主動 `git commit`**。這次環境建置
  （scaffold/設定檔/schema/測試骨架）全部都能在本環境驗證（build/test/typecheck/curl 都跑過），
  所以可以直接 commit+push；但之後一旦動到**需要使用者用瀏覽器實際操作確認的 UI 功能**，
  改完要停在工作目錄，等使用者說「測試 OK」才能 commit。
- **2026-08-19 起的推送流程（覆蓋上一條的「commit+push」部分，驗證方式改變）**：
  1. push 目標是 `origin dev`，不是 `main`——push 到 `dev` 會觸發 CodeRabbit 對變更做 code review。
  2. **Claude 不用自己啟動 dev server / curl API / 跑完整 `yarn build` 來驗證**，使用者會自己
     在本機測試過才繼續。但 TDD 的紅燈/綠燈循環（寫測試、跑 `yarn test`）跟 `tsc --noEmit`
     typecheck 照做，這是寫程式本身的一部分，不算「額外驗證」。
  3. 對話裡仍然不要宣稱功能「已確認可用」，只能說「寫完了、單元測試過，等你本機測」。
