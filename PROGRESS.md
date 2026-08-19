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
| ~~分類匯入改用固定 4 分類清單~~ → **分類改成 Google Places 動態回傳** | ✅ 完成，已實測 | 2026-08-19 使用者回饋「不應該局限在提供的四種，應該包含 Google Map 中會出現的所有分類」。改成廣泛查詢 `${city}餐廳` + 分頁（`searchRestaurantsInCity`），分類直接採用回應的 `primaryTypeDisplayName`（查無則退回 `primaryType`／「其他」），不再是我們自己預先猜的清單 |
| `scripts/import-restaurants.ts` 匯入腳本 | ✅ 完成，已實測 | `yarn import:restaurants` 已實際跑過新版：一次廣泛查詢 3 頁分頁，匯入 60 筆，涵蓋 **31 種不同的真實 Google 分類**（日式/台式/義大利/印度/拉麵/居酒屋/餐酒館…等），不再局限於燒肉/中式/牛排/甜點 |
| 台中市地理範圍過濾（`TAICHUNG_BOUNDS`/`isWithinTaichung`/`filterPlacesInTaichung`） | ✅ 完成 | 2026-08-19 使用者把 CodeRabbit 對 `dev` branch 上一版 push 的 review 建議貼給另一個 VS Code 內的 Claude session 套用（跟這個 CLI session **同時**編輯同一份工作目錄，兩邊都改到同幾支檔案）。雙重防線：Places API 請求層帶 `locationRestriction.rectangle`，DB 寫入前再用 `filterPlacesInTaichung` 過濾一次，避免「地址寫台中市但座標其實在別縣市」的髒資料。單元測試已補齊，整合後 20 個測試全過 |
| Google Places API 台中市種子資料真正匯入 DB | ⚠️ **需要清理** | 目前 DB 共 134 筆：**舊的 74 筆**（第一版匯入，燒肉/中式/牛排/甜點 4 個粗分類）+ **新的 60 筆**（新版匯入，31 個 Google 動態分類），placeId 不重疊、沒有互相覆蓋。舊資料的分類跟新邏輯不一致，建議使用者決定要不要清空 `Restaurant`/`Category` 表重新匯入一次求一致（本機開發資料庫，Claude 沒有主動清）|
| `category.list` tRPC procedure | ✅ 完成 | `src/server/routers/category.ts`，給首頁分類下拉選單用；**現在會回傳 31 個分類選項，不是原本的 4 個** |
| 首頁 UI（分類篩選＋單人座位開關＋餐廳卡片列表） | ✅ 完成程式碼，⏸ **未在瀏覽器實際看過** | `src/app/page.tsx`；component test（`tests/unit/HomePage.test.tsx`）全過；**沒有跑過 `yarn dev` 用瀏覽器肉眼確認過畫面**，按照 2026-08-19 的推送流程，這一步留給使用者本機驗證 |
| 固定導覽列（NavBar） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | `src/components/NavBar.tsx`，`fixed top-0` 固定在頁面最上方，`src/app/layout.tsx` 引入；`page.tsx` 的 `<main>` 加了 `pt-20` 避免內容被蓋住 |
| 分頁（每頁 10 筆＋分頁按鈕） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 使用者要求：每頁顯示 10 筆，下方分頁按鈕樣式「← 1 2 .. 目前頁 .. 倒數第二頁 最後一頁 →」。後端：`searchRestaurantsInputSchema` 加 `page` 欄位，Service 層新增純函式 `paginate`（切頁＋算 totalPages，5 個單元測試）；前端：`src/lib/pagination.ts` 的純函式 `buildPaginationItems` 算按鈕要顯示哪些頁碼（6 個單元測試涵蓋頭尾重疊/刪節號情境），`src/components/Pagination.tsx` 是純呈現元件，只有 1 頁時不顯示；切換分類/單人座位篩選會重置回第 1 頁（`HomePage.test.tsx` 新增 3 個分頁互動測試） |
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
10. **`globals.css` 的 `body { color: var(--foreground) }` 會隨 `prefers-color-scheme: dark`
    自動翻轉成接近白色（`#ededed`）**：這是 `create-next-app` 官方模板內建的自動深色模式。
    任何元件如果自己寫死背景色（例如 `bg-white`、`hover:bg-zinc-100`），卻沒有明確指定文字
    顏色，文字會繼承這個會翻轉的 `--foreground` 變數——瀏覽器/OS 在深色模式時就會變成
    「白底白字」看不清楚。**這個坑 2026-08-19 連續踩了兩次**：第一次是 `NavBar.tsx` 的
    `bg-white` 配沒寫顏色的 `<span>`；改用 `bg-background`/`text-foreground` 這組會一起翻轉
    的 CSS 變數修好 NavBar 之後，`Pagination.tsx` 的按鈕 `hover:bg-zinc-100`（寫死的淺色
    hover 背景）配沒寫顏色的按鈕文字，一樣的問題又發生了一次，使用者當面指出「跟一開始導覽列
    一樣白底白字」。
    **教訓（已通用適用全專案，不是只有 NavBar 這一個元件）**：只要一個元素或它的任何狀態
    （含 `hover:`/`disabled:` 等 variant）明確寫死了背景色，就要連文字顏色也一起明確寫死，
    兩者成對出現、不能只寫一半：
    - 想要背景/文字都跟著系統深色模式一起翻轉：兩個都用 `bg-background`/`text-foreground`
      這組 CSS 變數（`NavBar.tsx` 的做法）。
    - 想要固定樣式、不受系統深色模式影響（`Pagination.tsx` 目前的做法，因為頁面其餘內容也是
      用固定的 zinc-* 色階、不隨系統深色模式變化）：背景跟文字都用固定色階，例如
      `hover:bg-zinc-100` 要配 `text-zinc-700`，不能讓文字繼續繼承會翻轉的預設值。
    新增/修改任何有明確背景色（含 hover/active 等互動狀態）的元件之前，先
    `grep -rn "bg-white\|bg-zinc\|bg-black\|bg-background" src/` 檢查該元素跟它所有互動狀態
    是否都有配對的明確文字顏色，不要只檢查預設狀態就以為沒事。

## 下次接續開發時，建議的下一步（依優先序）

1. ~~申請 Google Places API Key、匯入台中市種子資料~~ ✅ 2026-08-19 完成
2. ~~做首頁 UI（分類篩選＋單人座位開關＋餐廳卡片）~~ ✅ 2026-08-19 程式碼完成
3. ~~分類改成 Google Places 動態回傳，不侷限固定 4 種~~ ✅ 2026-08-19 完成
4. ~~固定導覽列 + 分頁（每頁 10 筆＋分頁按鈕）~~ ✅ 2026-08-19 程式碼完成
5. **使用者接手：`git pull` 後 `yarn dev` 打開 http://localhost:3000 實際看一次畫面**——
   這一輪疊了不少前端改動（NavBar、分頁 UI）都還沒有人用瀏覽器肉眼確認過，這是目前最優先
   要做的事
6. DB 資料清理：目前 134 筆混著舊版（燒肉/中式/牛排/甜點 4 粗分類）跟新版（31 個 Google
   動態分類）的匯入結果，建議清空 `Restaurant`/`Category` 表後只用新版 `yarn import:restaurants`
   重新匯入一次，分類才會全部一致
7. 手動標註前 10-20 間熟悉的店的 `soloSeatStatus`/`soloSeatType`，作為第一批可信資料
   （目前資料全是 `UNKNOWN`，篩選「僅顯示有單人座位」現在測起來會是空結果，這是預期的，
   不是 bug——可以先用 Prisma Studio `yarn db:studio` 手動改幾筆來測 UI）
8. 補 acceptance test（Playwright e2e，對應主情境：燒肉＋單人座位篩選）
9. `yarn playwright install` 後才能真的跑 e2e

## 給接手對話的 AI 模型的提醒

- **這份文件跟 `docs/PLAN.md` 分工不同**：`docs/PLAN.md` 是完整的產品/架構規劃文件
  （情境模擬、資料模型設計理由、Phase 劃分），**變動不大**；這份 `PROGRESS.md` 才是每次
  對話都要更新的「現在做到哪」對照表。改完進度記得回來更新這裡的狀態欄位。
- 依照使用者全域規則：**沒有使用者親自驗證過的修改，不要主動 `git commit`**。這次環境建置
  （scaffold/設定檔/schema/測試骨架）全部都能在本環境驗證（build/test/typecheck/curl 都跑過），
  所以可以直接 commit+push；但之後一旦動到**需要使用者用瀏覽器實際操作確認的 UI 功能**，
  改完要停在工作目錄，等使用者說「測試 OK」才能 commit。
- **2026-08-19 起的推送流程，同一天糾正過一次方向，以下是糾正後的版本**：
  1. push 目標是 `origin dev`，不是 `main`——push 到 `dev` 會觸發 CodeRabbit 對變更做 code review。
  2. **正確順序是「使用者本機測試過 UI/功能，確認沒問題 → 才 push 到 dev」，不是「Claude 先
     push，使用者事後拉下來測」。** 這輪一開始誤解成後者，連續 push 了 3 個 commit（含一個
     NavBar 白底白字看不清楚的視覺 bug）都沒等使用者驗證，被當面糾正。
  3. **改完程式碼、單元測試/typecheck/lint 都過之後，先停在工作目錄，不要主動 commit/push**，
     跟使用者說「改完了、單元測試過，等你本機測過再幫你推」，等使用者明確說測過了才動手。
  4. Claude 不用自己啟動 dev server / curl API 做「執行期驗證」，那是使用者本機測試會做的事；
     但 TDD 的紅燈/綠燈循環（`yarn test`）跟 `tsc --noEmit` typecheck 照做，這是寫程式本身的
     一部分，跟「push 前要不要等使用者測試」是兩件事。
  5. 對話裡仍然不要宣稱功能「已確認可用」，只能說「寫完了、單元測試過，等你本機測」。
- **使用者會同時開兩個 Claude Code session 改同一份工作目錄**（這個 CLI session ＋ VS Code
  extension 裡的另一個 session），通常是把 CodeRabbit 對 `dev` push 的 review 建議貼給 VS Code
  那邊套用。2026-08-19 實際發生過：`placesClient.ts`／`restaurantImportService.ts` 在這個
  session 編輯過程中被另一個 session 即時改掉（新增了 `TAICHUNG_BOUNDS`/`isWithinTaichung`
  地理範圍過濾）。**遇到「檔案在我讀取/寫入之間被改了」的系統提示時，不要當成錯誤或衝突去
  revert，先讀完整檔案內容確認現況，跑一次 `yarn test`/`tsc --noEmit` 確認整合後還是綠燈，
  再繼續動作**；如果改動看起來不合理才需要跟使用者確認，不要預設是自己的問題。
