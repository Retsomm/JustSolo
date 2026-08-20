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
| 測試 | Vitest（單元/整合）+ React Testing Library + MSW。**不用 Playwright/瀏覽器 e2e**——2026-08-19 使用者明確表示 UI/功能驗證是使用者自己的責任範圍，不需要 Claude 另外架一套瀏覽器自動化重複做同一件事（詳見下方「已知的坑」與「給接手對話的 AI 模型的提醒」） |
| 資料來源 | Google Places API 匯入基本資料 + 人工補完單人座位資訊（尚未申請 API Key） |
| MVP 範圍 | 不做帳號系統/眾包回報 UI（schema 已保留 `SoloSeatReport` 供 Phase 2） |
| GitHub | https://github.com/Retsomm/JustSolo.git |
| 本機路徑 | `~/Projects/JustSolo` |
| Git 分支策略 | **2026-08-19 起：所有變更 push 到 `dev` branch（不推 `main`），觸發 CodeRabbit code review** |
| 推送前驗證方式 | **2026-08-19 修正版：改完程式碼、單元測試/typecheck 過了就停在工作目錄，等使用者本機測試 UI/功能確認 OK，才可以 commit+push。不是「Claude 先 push，使用者事後測」**（詳見文件最後「給接手對話的 AI 模型的提醒」，這條當天被使用者當面糾正過一次） |

## 進度對照表

| 項目 | 狀態 | 備註 |
|---|---|---|
| Next.js + TS + Tailwind scaffold | ✅ 完成 | `create-next-app`，App Router，`src/` 目錄 |
| Prisma + 本機 PostgreSQL | ✅ 完成 | 本機 DB `justsolo_db`（`createdb` 建立，trust auth 免密碼） |
| Prisma schema（Restaurant/Category/SoloSeatReport） | ✅ 完成 | 見 `prisma/schema.prisma`，已跑過 `init` migration |
| tRPC 串接（router/route handler/client provider） | ✅ 完成 | 已用 curl 驗證 GET 查詢能打通 Service→Client→DB，回傳空陣列（尚無資料） |
| Client/Service/Hook 分層骨架 | ✅ 完成 | `src/server/clients`、`src/server/services`、`src/hooks` |
| 第一個 TDD 測試（`filterAndSortBySoloSeat`） | ✅ 完成 | `tests/unit/restaurantSearchService.test.ts`，3 個測試全過 |
| Vitest 設定 | ✅ 完成 | 單元/整合測試用 Vitest，已驗證可跑 |
| ~~Playwright e2e~~（已移除） | ❌ **不採用** | 2026-08-19 曾經完整裝過 Chromium + 寫了 3 個 e2e 測試（`tests/e2e/`），全部通過，但使用者當面糾正：「UI 我會自己測試，你為何還要安裝」——UI/瀏覽器層級的驗證（不論自動化與否）都是使用者自己的範圍，Claude 不需要另外建立這套工具鏈。已整批移除：`tests/e2e/`、`playwright.config.ts`、`@playwright/test` 依賴、`package.json` 的 `e2e` script。**不要在這個專案重新加回 Playwright/瀏覽器 e2e，除非使用者明確改口要求** |
| 套件管理改用 yarn | ✅ 完成 | 已刪 `package-lock.json`／`node_modules`，改 `yarn install` 產生 `yarn.lock` |
| GitHub remote + 首次 push | ✅ 完成 | `origin` = Retsomm/JustSolo，`main` 已 push |
| `dev` branch 建立 + push | ✅ 完成 | `origin/dev` 已建立，之後開發都在這個 branch 上 |
| `placesClient.ts` 真正實作（Google Places API Text Search） | ✅ 完成，已實測 | 純函式 `buildTextSearchQuery`/`parsePlacesResponse` 有單元測試；2026-08-19 使用者提供 `GOOGLE_PLACE_NEW_API_KEY` 後已實際打過 Google 的伺服器，成功 |
| ~~分類匯入改用固定 4 分類清單~~ → **分類改成 Google Places 動態回傳** | ✅ 完成，已實測 | 2026-08-19 使用者回饋「不應該局限在提供的四種，應該包含 Google Map 中會出現的所有分類」。改成廣泛查詢 `${city}餐廳` + 分頁（`searchRestaurantsInCity`），分類直接採用回應的 `primaryTypeDisplayName`（查無則退回 `primaryType`／「其他」），不再是我們自己預先猜的清單 |
| `scripts/import-restaurants.ts` 匯入腳本 | ✅ 完成，已實測 | `yarn import:restaurants` 已實際跑過新版：一次廣泛查詢 3 頁分頁，匯入 60 筆，涵蓋 **31 種不同的真實 Google 分類**（日式/台式/義大利/印度/拉麵/居酒屋/餐酒館…等），不再局限於燒肉/中式/牛排/甜點 |
| 台中市地理範圍過濾（`TAICHUNG_BOUNDS`/`isWithinTaichung`/`filterPlacesInTaichung`） | ✅ 完成 | 2026-08-19 使用者把 CodeRabbit 對 `dev` branch 上一版 push 的 review 建議貼給另一個 VS Code 內的 Claude session 套用（跟這個 CLI session **同時**編輯同一份工作目錄，兩邊都改到同幾支檔案）。雙重防線：Places API 請求層帶 `locationRestriction.rectangle`，DB 寫入前再用 `filterPlacesInTaichung` 過濾一次，避免「地址寫台中市但座標其實在別縣市」的髒資料。單元測試已補齊，整合後 20 個測試全過 |
| Google Places API 台中市種子資料真正匯入 DB | ✅ 完成，改成分區查詢 | 2026-08-19 使用者發現只有 60-64 筆太少，質疑「是不是又設了篩選條件」。實測證實：**不是篩選問題，是 Google Places Text Search 對單一查詢字串（「台中市餐廳」）約有 60 筆結果的硬上限**（把分頁上限從 3 調到 6 重測，結果還是卡在 60），這是 Google API 本身的限制，不是我方 bug。改成對台中市 29 個行政區各自查詢一次（`TAICHUNG_DISTRICTS`／`buildDistrictAreas`，`searchRestaurantsInCity`→`searchRestaurantsInArea` 改名支援任意查詢字串），跑一次約 2.5 分鐘，**DB 現在有 1716 筆、81 種不同分類**，涵蓋面大幅提升 |
| `category.list` tRPC procedure | ✅ 完成 | `src/server/routers/category.ts`，給首頁分類下拉選單用；**現在會回傳 31 個分類選項，不是原本的 4 個** |
| 首頁 UI（分類篩選＋單人座位開關＋餐廳卡片列表） | ✅ 完成程式碼，⏸ **未在瀏覽器實際看過** | `src/app/page.tsx`；component test（`tests/unit/HomePage.test.tsx`）全過；**沒有跑過 `yarn dev` 用瀏覽器肉眼確認過畫面**，按照 2026-08-19 的推送流程，這一步留給使用者本機驗證 |
| 固定導覽列（NavBar） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | `src/components/NavBar.tsx`，`fixed top-0` 固定在頁面最上方，`src/app/layout.tsx` 引入；`page.tsx` 的 `<main>` 加了 `pt-20` 避免內容被蓋住 |
| 分頁（每頁 10 筆＋分頁按鈕） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 使用者要求：每頁顯示 10 筆，下方分頁按鈕樣式「← 1 2 .. 目前頁 .. 倒數第二頁 最後一頁 →」。後端：`searchRestaurantsInputSchema` 加 `page` 欄位，Service 層新增純函式 `paginate`（切頁＋算 totalPages，5 個單元測試）；前端：`src/lib/pagination.ts` 的純函式 `buildPaginationItems` 算按鈕要顯示哪些頁碼（6 個單元測試涵蓋頭尾重疊/刪節號情境），`src/components/Pagination.tsx` 是純呈現元件，只有 1 頁時不顯示；切換分類/單人座位篩選會重置回第 1 頁（`HomePage.test.tsx` 新增 3 個分頁互動測試） |
| 餐廳詳情頁 | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | MVP Must-have 清單裡最後一個沒做的功能。`placesClient.ts` field mask 加 `nationalPhoneNumber`（`PlaceSearchResult`/`RestaurantUpsertInput` 都補上 `phone` 欄位並貫穿 Client→Service→Import script）；新增 `RestaurantDetail` 型別、`prismaClient.findRestaurantById`、`restaurant.getById` tRPC procedure、`useRestaurantDetail` hook；`/restaurant/[id]` route（`page.tsx` 是 server component 拆 `params`，`RestaurantDetailView.tsx` 是實際渲染的 client component）；首頁卡片改用 `<Link>` 包住可以點進去。已重新跑過 `yarn import:restaurants` 回填電話（64 筆裡 59 筆有電話）。單元測試新增 4 個（`RestaurantDetailView.test.tsx`），共 39 個全過 |
| 全站色彩改用 `bg-background`/`text-foreground` 統一 token | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 使用者截圖回報「預設商店卡片看不清楚，hover 顏色太亮」。根因：`page.tsx`／`Pagination.tsx`／`RestaurantDetailView.tsx` 當初用固定 `zinc-*` 色階寫的，跟已經改用會翻轉的 `bg-background`/`text-foreground`（見上方「已知的坑」第 10 條）的 `NavBar.tsx` 混用——使用者系統是深色模式，`<main>` 背景跟著變黑，但卡片文字還是寫死的深色，hover 又是寫死的近白色。已把**全部**元件統一改用 `bg-background`/`text-foreground`（次要文字用透明度修飾符分層次，例如 `text-foreground/60`；hover 用 `hover:bg-foreground/5`；選中狀態用 `bg-foreground text-background` 顏色互換），用 `yarn build` 實測確認有正確編譯出 `color-mix()` CSS，`grep -rn "zinc-\|bg-white\|text-white\|bg-black\|text-black" src/` 確認全專案已無殘留固定色階。**首頁確認過 OK**；同一輪截圖也發現詳情頁內容太淡看不清楚——`RestaurantDetailView.tsx` 原本地址/電話/單人座位狀態用 `text-foreground/60`~`/70`，透明度疊在近黑背景上讀起來太暗，已把這三個核心資訊（使用者查詳情頁最在意的內容）改成不加透明度修飾符的 `text-foreground`（跟標題同亮度），只有真正次要的返回連結/分類標籤保留較淡的 `/60`~`/70`。使用者一度回報「還是看不清楚」，<br>追查發現不是顏色邏輯的問題（用 curl 直接檢查編譯後的 CSS 規則跟 dev server 回應確認過都是對的），<br>是**瀏覽器分頁沒有重新整理、還在看 HMR 更新前的舊畫面**——強制重新整理（Cmd+Shift+R）後確認<br>清楚了。**已經使用者確認 OK** |
| 搜尋店名輸入框 + 行政區篩選下拉選單 | ✅ 完成程式碼，⚠️ **實測失敗過一次，已修正** | 2026-08-19 使用者要求新增。**行政區篩選**：搭配先前的分區匯入，匯入時已經知道每筆餐廳來自哪個行政區查詢，`toRestaurantUpsertInput` 加 `district` 參數存進 DB（已重新跑 `yarn import:restaurants` 回填，1797 筆裡 1688 筆有行政區），新增 `prismaClient.listDistricts`／`districtService`／`district.list` tRPC procedure／`useDistricts` hook，比照 `category` 的四層寫法。**店名搜尋**：`searchRestaurantsInputSchema` 加 `keyword`，`findRestaurants` 用 Prisma `contains`+`insensitive` 模糊比對；前端用新寫的 `useDebouncedValue` hook（300ms debounce，2 個單元測試用 `vi.useFakeTimers` 驗證）避免每個按鍵都打一次 API。切換行政區/輸入關鍵字都會重置回第 1 頁。**使用者實測回報「兩個篩選都完全沒作用，畫面跳動一下但資料沒變」**——根因是 `restaurantSearchService.ts` 的 `searchRestaurants` 呼叫 `findRestaurants` 時漏傳 `district`/`keyword` 這兩個欄位（Client 層跟型別都有加，Service 層組合呼叫時忘記接線），UI 送出的篩選條件在後端被悄悄丟掉。已修正並補上專門測這個接線的單元測試（mock `findRestaurants`，驗證 `searchRestaurants` 有把 input 的每個欄位都轉呼叫過去），實際 revert 一次確認這個測試真的會抓到這個 bug。`HomePage.test.tsx` 新增 2 個、`restaurantSearchService.test.ts` 新增 1 個，共 45 個全過。**尚未經使用者重新測試確認修好** |
| 主題色切換（深色/淺色，淺色用米色系不用死白） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 使用者要求：「因為 code review 達限制沒觸發」時新增的小功能。淺色主題背景 `#f3ebd8`（米色）、文字 `#4a3c2c`（深棕），不是純白/純黑。`src/lib/theme.ts` 純函式 `resolveTheme`（決定套用哪個主題：手動選過的 > 系統偏好 > 淺色）/`toggleTheme`，6 個單元測試。`NavBar.tsx` 改成 client component 加切換按鈕，`layout.tsx` 依照 Next.js 官方「[Preventing Flash before Hydration](node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md)」文件的作法：`<head>` 塞一段 inline script 在瀏覽器繪製前讀 localStorage 設定 `data-theme` 屬性，`<html>` 加 `suppressHydrationWarning`，`NavBar` 用 `useLayoutEffect`（不是 `useEffect`）在繪製前重新套用一次（因為 dev 模式 React Strict Mode 重新掛載會把 inline script 設的屬性清掉，這是官方文件明確提到的已知情況）。`tests/setup.ts` 補了 `window.matchMedia` 的假實作（jsdom 沒有內建）。`NavBar.test.tsx` 新增 4 個測試涵蓋：跟隨系統偏好、已存過的選擇優先於系統偏好、點擊會寫回 localStorage 並更新 DOM 屬性。共 55 個測試全過。使用者接著要求按鈕拿掉文字/emoji，只留簡約線條圖示——已改成<br>`src/components/icons/ThemeIcons.tsx` 手寫的 inline SVG（`SunIcon`/`MoonIcon`，<br>stroke 線條風格，`currentColor` 跟著 `text-foreground` 走，沒有另外裝圖示套件），<br>按鈕保留 `aria-label` 供螢幕閱讀器使用 |
| NavBar SSR/hydration 一致性修正 | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 由並行的 VS Code session 修正、整合進這個 session：上一版主題切換的 `useLayoutEffect` 一掛載就同步讀 `localStorage`/`matchMedia` 並 `setTheme`，伺服器渲染（`typeof window === "undefined"`）跟瀏覽器 hydration 第一次 render 用的初始值不一致，會觸發 React hydration mismatch。改成 `useState<Theme>("light")` 初始值固定為 `"light"`（跟 SSR 結果一致），實際主題留到 hydration 完成後的 effect 裡才校正；effect 內另外訂閱 `matchMedia` 的 `change` 事件，手動選過主題後不會被系統偏好切換覆蓋（用 `isManualRef` 判斷）。測試方法幾經修正：一開始用 process 層級的 `uncaughtException`/`unhandledRejection` 攔截 mismatch，實測對 React 19 可自動修補的 mismatch 完全抓不到、斷言恆真沒有保護力，改用 `hydrateRoot` 官方提供的 `onRecoverableError` 選項才是可靠偵測方式（`NavBar.test.tsx` 新增 `renderToString` + `hydrateRoot` 的 SSR+hydration 一致性測試）。共 61 個單元測試全過，typecheck/lint/build 均乾淨。 |
| 行政區匯入資料改用地址驗證（不再直接信任查詢來源） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 由並行的 VS Code session 修正、整合進這個 session：先前 `toRestaurantUpsertInput` 的 `district` 直接採用查詢時帶入的行政區字串（例如查「台中市西區餐廳」查到的結果就存 `district: "西區"`），但 Google Places Text Search 是相關性排序，同一筆結果可能因為排名被帶到鄰近行政區的查詢裡，導致存入錯誤的行政區。改成驗證 Google 回傳的權威地址欄位（`place.address`）是否真的包含該行政區名稱字串，驗證不過就存 `null`（寧可缺值也不要存錯）。尚未重新跑過 `yarn import:restaurants` 回填既有 DB 資料，現有 1688 筆有行政區的資料是舊邏輯匯入的，可能混有少量錯誤行政區的髒資料。 |
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
    - 想要固定樣式、不受系統深色模式影響：背景跟文字都用固定色階，兩者成對出現。
    **2026-08-19 第三次踩到（餐廳卡片預設看不清楚 + hover 太亮）**：這次不是漏配對，是整個
    App 混用了兩套邏輯——`NavBar.tsx` 用會翻轉的 `bg-background`/`text-foreground`，但
    `page.tsx`／`Pagination.tsx`／`RestaurantDetailView.tsx` 用固定的 `zinc-*` 色階（預設寫
    的是淺色主題的深色文字：`text-zinc-900`/`700`/`600`）。使用者系統是深色模式，`NavBar`
    正確跟著變黑底白字，但頁面其餘內容的 `<main>` 背景繼承 `body` 也變黑，餐廳卡片卻還是
    寫死的深色文字（`text-zinc-900` 等）疊在黑色背景上——變成「深字疊深底」看不清楚；
    hover 用 `bg-zinc-50`（幾乎純白、不透明）疊上去反而「太亮」、跟深色頁面格格不入。
    **最終修法（已在全站套用，不再混用兩套邏輯）**：**全部**元件統一改用
    `bg-background`/`text-foreground` 這組會翻轉的 CSS 變數，次要文字用透明度修飾符調整
    層次（`text-foreground/60`＝60% 不透明度，數字越小越淡），hover 用
    `hover:bg-foreground/5`（只疊 5% 不透明度的前景色，深色模式下是極淡的亮灰、淺色模式下是
    極淡的暗灰，不會是死板的純白或純黑），選中狀態（例如目前頁碼）用
    `bg-foreground text-background`（顏色互換，兩個主題下都會是最高對比的「反色」效果）。
    Tailwind v4 對 `@theme inline` 定義出來的顏色 token 原生支援透明度修飾符（`/60`、`/5`
    這種寫法），編譯出來是 `color-mix(in oklab, var(--foreground) 60%, transparent)`，
    已用 `yarn build` 實測確認有正確產生對應的 CSS class，不是憑感覺猜語法。
    新增/修改任何有明確背景色（含 hover/active 等互動狀態）的元件之前，先
    `grep -rn "zinc-\|bg-white\|text-white\|bg-black\|text-black" src/` 確認**整個專案**
    沒有殘留固定色階跟 `bg-background`/`text-foreground` 混用，不要只檢查單一元件。
11. **Playwright e2e 已經整套裝好、3 個測試也全過，但被使用者要求整批移除**（見上方進度
    對照表「~~Playwright e2e~~（已移除）」那一列）。曾經踩過的技術坑（Playwright Test 預設
    CommonJS transform 不能 import Prisma 7 產生的 ESM-only Client，需要改用 `pg` 直接下 SQL）
    已經隨程式碼一起刪除，不再贅述——**這條的重點不是技術細節，是流程教訓**：
    Claude 主動安裝新工具鏈（尤其是會下載大型二進位檔的，例如瀏覽器）之前，
    先確認這個工具解決的問題是不是使用者已經明確說過「我會自己處理」的範圍，
    不要因為它出現在最初的技術棧規劃裡就自動當成「該做的事」去做。
12. **新增動態路由（例如 `app/restaurant/[id]/page.tsx`）後，`PageProps<'/restaurant/[id]'>`
    這種型別 helper 一開始會報 `Type '"/restaurant/[id]"' does not satisfy the constraint
    '"/"'.`**：因為這些型別是 `next dev`/`next build`/`next typegen` 掃描 `app/` 目錄實際
    路由後才產生的，剛新增的檔案還沒被掃描過。**修法**：跑一次 `npx next typegen`
    （不用整個 build，比較快）重新產生型別，`tsc --noEmit` 就會過。
13. **Google Places Text Search 不是穩定/確定性的查詢**：同一個查詢字串（`台中市餐廳`）
    重複呼叫，回傳的結果集合可能不完全一樣（這次從 60 筆變成 64 筆，多了 4 間之前沒出現的
    店）。這是 Google 排名演算法本身的性質，**不是 bug**，`upsertRestaurantByPlaceId` 用
    `placeId` upsert 是安全的（不會重複、不會刪掉舊資料只會疊加），但代表「重新匯入」不會
    每次都得到完全一致的資料筆數，這是預期中的正常現象。
14. **Google Places Text Search（New）對單一查詢字串約有 60 筆結果的硬上限，跟分頁上限設多高
    無關**：實測把 `maxPages` 從 3 調到 6 重跑，結果還是卡在 60 筆——`nextPageToken` 在第 3 頁
    後就不再出現了，不是我方程式碼漏抓，是 Google 這個 API 端點本身的限制（延續自舊版
    Places API 已知的 60 筆上限）。**修法**：不要指望靠加大分頁數解決覆蓋率問題，改成對
    多個更小範圍的查詢字串各自查一次（這裡是台中市 29 個行政區），靠 `placeId` 去重合併
    （見 `importCityRestaurants` 用 `Set<string>` 追蹤已處理過的 `placeId`）。這個限制對任何
    用 Google Places Text Search 做「列出某地區所有 X」的匯入情境都適用，不限這個專案。
15. **懷疑「改了程式碼但畫面沒變」時，先用 `curl` 直接檢查 dev server 實際回應的內容，
    不要先假設是自己的邏輯錯了**：2026-08-19 使用者回報詳情頁改完顏色還是看不清楚，Claude
    一開始檢查原始碼、編譯後的 CSS 規則都沒問題，但當下 `curl` 到的 HTML 其實只是資料還沒
    載入的初始畫面（`isLoading` 狀態），不是實際渲染結果，**這個驗證方法本身有漏洞，不能
    證明什麼**。回頭問使用者「有沒有強制重新整理」才發現是瀏覽器分頁還停在 HMR 更新前的
    舊畫面。**教訓**：dev server 開很久、中間改過很多次的情況下，「程式碼邏輯檢查過都對，
    但畫面看起來還是舊的」，第一個該懷疑的是瀏覽器快取/沒重新整理，不是繼續往程式碼裡找
    不存在的 bug——這條呼應全域 `~/.claude/CLAUDE.md` 已有的「先比對編譯產物時間戳」教訓，
    這次是同一類問題在「client component 資料非同步載入」情境下的變形。
16. **Service 層的「組合層」函式（呼叫 Client 層、參數一路轉手傳下去的那種）如果只測底下的
    純函式，不會抓到「漏傳某個參數」這種接線 bug**：2026-08-19 新增 `district`/`keyword`
    篩選時，`searchRestaurantsInputSchema`（型別）、`findRestaurants`（Client 層）都正確
    加了這兩個欄位，但 `searchRestaurants`（Service 層組合呼叫的地方）忘記把
    `input.district`/`input.keyword` 轉傳給 `findRestaurants`——型別上不會報錯（因為
    `findRestaurants` 的參數是 optional，少傳等於沒篩選，語法上合法），单元測試也測不出來
    （`filterAndSortBySoloSeat`/`paginate` 這兩個純函式測試都還是綠燈，因為它們根本不知道
    `district`/`keyword` 這兩個欄位存在），一路到使用者實測「篩選完全沒作用」才發現。
    **教訓**：像 `searchRestaurants` 這種「輸入物件有 5、6 個欄位，組合層再轉呼叫給
    Client」的函式，新增/修改任何一個欄位時，除了測純函式本身，還要**額外補一個測試直接斷言
    組合層有沒有把每個欄位都轉呼叫過去**（mock 掉 Client 層那個函式，斷言呼叫參數），不能
    只信賴型別檢查「有 optional 欄位就不會報錯」這件事——這次修完後有補上
    `tests/unit/restaurantSearchService.test.ts` 的 `searchRestaurants` 測試，並且刻意
    revert 一次程式碼實測確認這個測試真的會抓到這個 bug 才算數，不是寫了測試就相信它有效。

## 下次接續開發時，建議的下一步（依優先序）

1. ~~申請 Google Places API Key、匯入台中市種子資料~~ ✅ 2026-08-19 完成
2. ~~做首頁 UI（分類篩選＋單人座位開關＋餐廳卡片）~~ ✅ 2026-08-19 程式碼完成
3. ~~分類改成 Google Places 動態回傳，不侷限固定 4 種~~ ✅ 2026-08-19 完成
4. ~~固定導覽列 + 分頁（每頁 10 筆＋分頁按鈕）~~ ✅ 2026-08-19 完成，使用者已本機測試確認 OK
5. ~~使用者本機用瀏覽器實際看一次畫面~~ ✅ 2026-08-19 完成（過程中抓到 NavBar/Pagination
   深色模式白底白字的 bug，已修好並經使用者確認）
6. ~~`yarn playwright install` + 補 acceptance e2e test~~ 2026-08-19 完成過（3 個測試全過），
   但**隨即被使用者要求整批移除**——UI/瀏覽器驗證是使用者自己的範圍，不需要 Claude 建這套
   工具鏈。**不要重新加回 Playwright**，除非使用者明確改口要求
7. ~~DB 資料清理~~ ✅ 2026-08-19 經使用者確認後清空重新匯入
8. ~~餐廳詳情頁~~ ✅ 2026-08-19 完成，見下方進度對照表，**尚未在瀏覽器實際看過**
9. 手動標註前 10-20 間熟悉的店的 `soloSeatStatus`/`soloSeatType`，作為第一批可信資料
   （目前資料全是 `UNKNOWN`，篩選「僅顯示有單人座位」現在測起來會是空結果，這是預期的，
   不是 bug——可以先用 Prisma Studio `yarn db:studio` 手動改幾筆來測 UI）
10. Phase 2：眾包回報 UI（`SoloSeatReport` schema 已有）、地圖檢視、帳號系統

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
- **UI／瀏覽器層級的驗證，不論自動化與否，都是使用者自己的範圍，不是 Claude 該建立的東西**：
  2026-08-19 Claude 主動裝了 Playwright + Chromium、寫了 3 個 e2e 測試（自認為「這是自動化的
  TDD 測試，不算使用者說的『我自己測 UI』」），結果被當面糾正：「我一開始就說過 UI 我會自己
  測試了你為何還要安裝？」——整套被要求移除。**教訓**：判斷一件事要不要做，不能只看「這件事
  本身是不是自動化、算不算 TDD 方法論的一部分」，要看「使用者是否已經明確認領這個範圍」；
  使用者說過「UI 我會自己測」之後，跑瀏覽器（不管是人工點還是 Playwright 自動點）都算在使用者
  的範圍內，Claude 不用另外重複建置一套工具鏈去做同一件事，即使這件事出現在最初討論過的
  技術棧規劃裡也一樣——**規劃階段講過的技術棧不等於「現在就該主動做」的授權**，尤其是會
  安裝大型二進位檔（瀏覽器）這種有實質成本的操作，不確定時應該先問。這個專案目前**沒有
  e2e/瀏覽器自動化測試**，只靠 Vitest 單元/整合測試 + 使用者本機手動驗證，不要重新加回
  Playwright 或類似工具，除非使用者明確改口要求。
