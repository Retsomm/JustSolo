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
| 首頁 UI（分類篩選＋單人座位開關＋餐廳卡片列表） | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | `src/app/page.tsx`；component test（`tests/unit/HomePage.test.tsx`）全過 |
| 固定導覽列（NavBar） | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | `src/components/NavBar.tsx`，`fixed top-0` 固定在頁面最上方，`src/app/layout.tsx` 引入；`page.tsx` 的 `<main>` 加了 `pt-20` 避免內容被蓋住 |
| 分頁（每頁 10 筆＋分頁按鈕） | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | 2026-08-19 使用者要求：每頁顯示 10 筆，下方分頁按鈕樣式「← 1 2 .. 目前頁 .. 倒數第二頁 最後一頁 →」。後端：`searchRestaurantsInputSchema` 加 `page` 欄位，Service 層新增純函式 `paginate`（切頁＋算 totalPages，5 個單元測試）；前端：`src/lib/pagination.ts` 的純函式 `buildPaginationItems` 算按鈕要顯示哪些頁碼（6 個單元測試涵蓋頭尾重疊/刪節號情境），`src/components/Pagination.tsx` 是純呈現元件，只有 1 頁時不顯示；切換分類/單人座位篩選會重置回第 1 頁（`HomePage.test.tsx` 新增 3 個分頁互動測試） |
| 餐廳詳情頁 | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | MVP Must-have 清單裡最後一個沒做的功能。`placesClient.ts` field mask 加 `nationalPhoneNumber`（`PlaceSearchResult`/`RestaurantUpsertInput` 都補上 `phone` 欄位並貫穿 Client→Service→Import script）；新增 `RestaurantDetail` 型別、`prismaClient.findRestaurantById`、`restaurant.getById` tRPC procedure、`useRestaurantDetail` hook；`/restaurant/[id]` route（`page.tsx` 是 server component 拆 `params`，`RestaurantDetailView.tsx` 是實際渲染的 client component）；首頁卡片改用 `<Link>` 包住可以點進去。已重新跑過 `yarn import:restaurants` 回填電話（64 筆裡 59 筆有電話）。單元測試新增 4 個（`RestaurantDetailView.test.tsx`），共 39 個全過 |
| 全站色彩改用 `bg-background`/`text-foreground` 統一 token | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-19 使用者截圖回報「預設商店卡片看不清楚，hover 顏色太亮」。根因：`page.tsx`／`Pagination.tsx`／`RestaurantDetailView.tsx` 當初用固定 `zinc-*` 色階寫的，跟已經改用會翻轉的 `bg-background`/`text-foreground`（見上方「已知的坑」第 10 條）的 `NavBar.tsx` 混用——使用者系統是深色模式，`<main>` 背景跟著變黑，但卡片文字還是寫死的深色，hover 又是寫死的近白色。已把**全部**元件統一改用 `bg-background`/`text-foreground`（次要文字用透明度修飾符分層次，例如 `text-foreground/60`；hover 用 `hover:bg-foreground/5`；選中狀態用 `bg-foreground text-background` 顏色互換），用 `yarn build` 實測確認有正確編譯出 `color-mix()` CSS，`grep -rn "zinc-\|bg-white\|text-white\|bg-black\|text-black" src/` 確認全專案已無殘留固定色階。**首頁確認過 OK**；同一輪截圖也發現詳情頁內容太淡看不清楚——`RestaurantDetailView.tsx` 原本地址/電話/單人座位狀態用 `text-foreground/60`~`/70`，透明度疊在近黑背景上讀起來太暗，已把這三個核心資訊（使用者查詳情頁最在意的內容）改成不加透明度修飾符的 `text-foreground`（跟標題同亮度），只有真正次要的返回連結/分類標籤保留較淡的 `/60`~`/70`。使用者一度回報「還是看不清楚」，<br>追查發現不是顏色邏輯的問題（用 curl 直接檢查編譯後的 CSS 規則跟 dev server 回應確認過都是對的），<br>是**瀏覽器分頁沒有重新整理、還在看 HMR 更新前的舊畫面**——強制重新整理（Cmd+Shift+R）後確認<br>清楚了。**已經使用者確認 OK** |
| 搜尋店名輸入框 + 行政區篩選下拉選單 | ✅ 完成程式碼＋**使用者已重新測試確認修好**（2026-08-20） | 2026-08-19 使用者要求新增。**行政區篩選**：搭配先前的分區匯入，匯入時已經知道每筆餐廳來自哪個行政區查詢，`toRestaurantUpsertInput` 加 `district` 參數存進 DB，新增 `prismaClient.listDistricts`／`districtService`／`district.list` tRPC procedure／`useDistricts` hook，比照 `category` 的四層寫法。**店名搜尋**：`searchRestaurantsInputSchema` 加 `keyword`，`findRestaurants` 用 Prisma `contains`+`insensitive` 模糊比對；前端用新寫的 `useDebouncedValue` hook（300ms debounce，2 個單元測試用 `vi.useFakeTimers` 驗證）避免每個按鍵都打一次 API。切換行政區/輸入關鍵字都會重置回第 1 頁。**使用者第一次實測回報「兩個篩選都完全沒作用，畫面跳動一下但資料沒變」**——根因是 `restaurantSearchService.ts` 的 `searchRestaurants` 呼叫 `findRestaurants` 時漏傳 `district`/`keyword` 這兩個欄位（Client 層跟型別都有加，Service 層組合呼叫時忘記接線），UI 送出的篩選條件在後端被悄悄丟掉。已修正並補上專門測這個接線的單元測試（mock `findRestaurants`，驗證 `searchRestaurants` 有把 input 的每個欄位都轉呼叫過去），實際 revert 一次確認這個測試真的會抓到這個 bug。`HomePage.test.tsx` 新增 2 個、`restaurantSearchService.test.ts` 新增 1 個，共 45 個全過。 |
| 主題色切換（深色/淺色，淺色用米色系不用死白） | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | 2026-08-19 使用者要求：「因為 code review 達限制沒觸發」時新增的小功能。淺色主題背景 `#f3ebd8`（米色）、文字 `#4a3c2c`（深棕），不是純白/純黑。`src/lib/theme.ts` 純函式 `resolveTheme`（決定套用哪個主題：手動選過的 > 系統偏好 > 淺色）/`toggleTheme`，6 個單元測試。`NavBar.tsx` 改成 client component 加切換按鈕，`layout.tsx` 依照 Next.js 官方「[Preventing Flash before Hydration](node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md)」文件的作法：`<head>` 塞一段 inline script 在瀏覽器繪製前讀 localStorage 設定 `data-theme` 屬性，`<html>` 加 `suppressHydrationWarning`，`NavBar` 用 `useLayoutEffect`（不是 `useEffect`）在繪製前重新套用一次（因為 dev 模式 React Strict Mode 重新掛載會把 inline script 設的屬性清掉，這是官方文件明確提到的已知情況）。`tests/setup.ts` 補了 `window.matchMedia` 的假實作（jsdom 沒有內建）。`NavBar.test.tsx` 新增 4 個測試涵蓋：跟隨系統偏好、已存過的選擇優先於系統偏好、點擊會寫回 localStorage 並更新 DOM 屬性。共 55 個測試全過。使用者接著要求按鈕拿掉文字/emoji，只留簡約線條圖示——已改成<br>`src/components/icons/ThemeIcons.tsx` 手寫的 inline SVG（`SunIcon`/`MoonIcon`，<br>stroke 線條風格，`currentColor` 跟著 `text-foreground` 走，沒有另外裝圖示套件），<br>按鈕保留 `aria-label` 供螢幕閱讀器使用 |
| NavBar SSR/hydration 一致性修正 | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | 2026-08-19 由並行的 VS Code session 修正、整合進這個 session：上一版主題切換的 `useLayoutEffect` 一掛載就同步讀 `localStorage`/`matchMedia` 並 `setTheme`，伺服器渲染（`typeof window === "undefined"`）跟瀏覽器 hydration 第一次 render 用的初始值不一致，會觸發 React hydration mismatch。改成 `useState<Theme>("light")` 初始值固定為 `"light"`（跟 SSR 結果一致），實際主題留到 hydration 完成後的 effect 裡才校正；effect 內另外訂閱 `matchMedia` 的 `change` 事件，手動選過主題後不會被系統偏好切換覆蓋（用 `isManualRef` 判斷）。測試方法幾經修正：一開始用 process 層級的 `uncaughtException`/`unhandledRejection` 攔截 mismatch，實測對 React 19 可自動修補的 mismatch 完全抓不到、斷言恆真沒有保護力，改用 `hydrateRoot` 官方提供的 `onRecoverableError` 選項才是可靠偵測方式（`NavBar.test.tsx` 新增 `renderToString` + `hydrateRoot` 的 SSR+hydration 一致性測試）。共 61 個單元測試全過，typecheck/lint/build 均乾淨。 |
| 行政區匯入資料改用地址驗證（不再直接信任查詢來源） | ✅ 完成程式碼＋已重新匯入＋**使用者已本機測試確認 OK**（2026-08-20） | 2026-08-19 由並行的 VS Code session 修正、整合進這個 session：先前 `toRestaurantUpsertInput` 的 `district` 直接採用查詢時帶入的行政區字串（例如查「台中市西區餐廳」查到的結果就存 `district: "西區"`），但 Google Places Text Search 是相關性排序，同一筆結果可能因為排名被帶到鄰近行政區的查詢裡，導致存入錯誤的行政區。改成驗證 Google 回傳的權威地址欄位（`place.address`）是否真的包含該行政區名稱字串，驗證不過就存 `null`（寧可缺值也不要存錯）。已重新跑過 `yarn import:restaurants`（分區查詢 29 個行政區，耗時約 156 秒，`upsertRestaurantByPlaceId` 用 `placeId` upsert 不會重複），現況 DB 共 1953 筆，1795 筆（91.9%）有經過地址驗證的行政區資料。 |
| 使用者帳號/眾包回報 UI | ✅ 完成程式碼，⏸ **需要使用者完成 Google OAuth 申請＋本機測試才能用** | 2026-08-20 用 `EnterPlanMode` 規劃後實作。**帳號系統**：Auth.js v5（`next-auth@beta`），Google OAuth，session 策略選 JWT、**不用 Auth.js 的 Prisma adapter**（不建 `Account`/`Session`/`VerificationToken` 表，理由：只有一個 provider、不需要多裝置 session revocation，adapter 那套表對「輕量帳號系統」是過度設計）——只加一張精簡 `User` 表（`src/auth.ts` 的 `jwt` callback 登入時透過 `authService.registerOrUpdateUser`→`prismaClient.upsertUserByEmail` upsert，`session.user.id` 靠 `src/types/next-auth.d.ts` 的 module augmentation 帶到前端）。`src/app/api/auth/[...nextauth]/route.ts` re-export `handlers`。**眾包回報**：`SoloSeatReport` 加 `userId`（關聯 `User`）+ `@@unique([restaurantId, userId])`（一人一店一票，用 `upsert` 語意寫入，同帳號重複回報是覆寫不是疊加，避免洗分數）；`soloSeatReportService.ts` 的 `computeSoloSeatStatus` 是純函式（≥2 筆回報且比例 ≥0.6/≤0.4 才判定 `CONFIRMED_YES`/`CONFIRMED_NO`，未達門檻維持 `UNKNOWN`，避免單一使用者一票洗成定論），`submitSoloSeatReport` 組合層寫入回報後重新拉全部回報整批重算（不是遞增）寫回 `Restaurant.soloSeatStatus`/`soloSeatConfidence`——比照 `restaurantSearchService.ts` 已踩過的坑（已知的坑 #16），補了 wiring test 斷言四個 Client 呼叫參數完整，並**刻意 revert 一次程式碼實測確認測試真的會紅燈**（drop 掉 `note` 欄位，測試立刻抓到）。**tRPC 層**新增 `Context`/`protectedProcedure`（沒有 session 就丟 `UNAUTHORIZED`），`route.ts` 的 `createContext` 改成 `async () => ({ session: await auth() })`。**前端**：`NavBar.tsx` 加登入/登出按鈕（`useSession()`，`status==="loading"` 時不渲染，避免 hydration 不一致；已登入顯示名字+登出，未登入顯示登入）；`providers.tsx` 包一層 `SessionProvider`；`layout.tsx` 把 `NavBar` 移進 `Providers` 內（原本是手足關係，`NavBar` 需要 session context）；`RestaurantDetailView.tsx` 新增信心分數/回報則數顯示（`reportCount===0` 時不顯示）+ `SoloSeatReportForm`（未登入顯示登入提示，已登入兩顆按鈕「有/沒有單人座位」+ 選填備註，送出後 `trpc.useUtils()` invalidate 詳情頁快取即時反映新狀態）。**刻意排除的範圍**（避免這輪做過大，留給使用者用過後再決定要不要加）：不做「顯示我自己已回報過什麼」的預填、不做回報列表/備註牆、不做限流、不加 `proxy.ts`（MVP 沒有需要伺服器端攔截重導的頁面，未登入使用者能看到表單但送出會被 `protectedProcedure` 擋掉，UX 上已足夠）。DB migration 因為 Bash 工具是非互動環境、`prisma migrate dev` 會直接報錯拒絕執行，改用 `prisma migrate diff --from-config-datasource --to-schema` 產生 SQL、手動建立 migration 資料夾、`prisma migrate deploy` 套用（`SoloSeatReport` 表原本是空的，加非空 `userId` 不需要 backfill，已用 `psql` 確認過）。單元測試新增 15 個（`soloSeatReportService.test.ts` 9 個、`SoloSeatReportForm.test.tsx` 4 個、`NavBar.test.tsx`/`RestaurantDetailView.test.tsx` 各補 2-3 個），共 89 個全過；`tsc --noEmit`/`yarn lint`/`yarn build` 均乾淨，`grep -rn "zinc-\|bg-white\|text-white\|bg-black\|text-black" src/` 確認沒有殘留固定色階。**Claude 完全沒辦法在本環境驗證登入流程本身**（需要真的 Google OAuth Client + 瀏覽器操作），依專案 git 紀律停在工作目錄未 commit——使用者接手時要做：(1) Google Cloud Console 申請 OAuth Client（Web application，redirect URI `http://localhost:3000/api/auth/callback/google`），填入 `.env` 的 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`AUTH_SECRET`；(2) 本機測登入/登出、NavBar 狀態切換、詳情頁送出回報（含未登入提示）、送出後即時更新信心分數、同帳號對同店重複回報是覆蓋不是疊加。 |
| 眾包回報並行寫入改用 transaction＋row lock | ✅ 完成，已本機腳本實測 | 2026-08-20（同一天稍晚，接續上面「使用者帳號/眾包回報 UI」那輪）：原本寫入回報、重算信心分數、寫回 `Restaurant` 是三個獨立查詢，兩個使用者同時對同一間店回報時，後寫入的一方可能拿著過期的回報清單算出錯誤的 aggregate 蓋掉正確結果（lost update）。改成 `prismaClient.ts` 新增 `submitSoloSeatReportTransaction`，用 `SELECT ... FOR UPDATE` 鎖住該餐廳 row，三步包在同一個 transaction 裡序列化並行回報。用腳本在本機 DB 實測過：拿掉鎖會重現 lost update，加回鎖後並行回報正確反映兩筆結果。**這個修改屬於「純後端邏輯，本環境可驗證」的範圍，已 commit+push 到 `dev`**（commit `901dae5`），不是需要使用者瀏覽器驗證才能動 git 的那類修改。**使用者後續已完成 Google OAuth Client 申請，本機測試登入/登出/送出回報/信心分數更新/重複回報覆寫，全部確認 OK**——上一列「使用者帳號/眾包回報 UI」的待驗證狀態視為已解除。 |
| 「單人用餐友善度」評分（Phase 2 最後一項） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-20（新一輪對話）使用者選定這個方向。純函式 `computeSoloFriendlinessScore`（`restaurantSearchService.ts`）把 `soloSeatStatus`/`soloSeatConfidence`/`soloSeatType` 換算成 0-100 分：`CONFIRMED_YES` 底分 70＋信心分數最多貢獻 30 分，`CONFIRMED_NO` 信心分數越高分數越低（0-20 分，不會落入「適合」等級），`UNKNOWN` 固定 40 分；三種狀態都有 `soloSeatType`（座位類型描述）+5 分加成。標籤依分數分四級：非常適合單人（≥85）/適合單人（≥65）/未知建議致電確認（≥35）/不建議單人前往（<35），四個門檻刻意抓在三種狀態的分數區間之間，不會打亂原本 YES>UNKNOWN>NO 的群組順序。`filterAndSortBySoloSeat` 排序邏輯從單純比較 `soloSeatStatus` 改成比較算出來的分數（群組順序不變，同狀態內依信心分數/座位類型細分排序，是一個小幅改進）。型別上新增 `RestaurantSearchResultWithFriendliness`（`RestaurantSearchResult` 加 `soloFriendlinessScore`/`soloFriendlinessLabel`），比照既有的 Client/Service 分工——`findRestaurants`/`findRestaurantById`（Client 層）只補上原始的 `soloSeatConfidence` 欄位，友善度分數計算留在 Service 層（`getRestaurantById`／`filterAndSortBySoloSeat`）算好才回傳，Client 層不含業務邏輯。新增 `src/components/FriendlinessBadge.tsx`（純呈現元件），首頁卡片、詳情頁都加上這個徽章。顏色比照專案既有的 `bg-background`/`text-foreground` token 慣例，`globals.css` 新增 `--success`/`--danger` 這組會跟著淺色/深色主題翻轉的 token（不是寫死色階），`yarn build` 實測確認編譯出正確的 `color-mix()` CSS。地圖 marker 顏色/Leaflet popup 不受影響（維持原本比照 soloSeatStatus 上色，未疊加友善度分數，避免範圍過大）。單元測試新增 7 個（`computeSoloFriendlinessScore` 4 個涵蓋三種狀態＋加分上限、`resolveSoloFriendlinessLabel` 邊界值 1 個、`filterAndSortBySoloSeat` 同狀態內依分數排序＋回傳友善度欄位 2 個），`HomePage.test.tsx`/`RestaurantDetailView.test.tsx` 各補一個徽章文字斷言，共 96 個全過；`tsc --noEmit`/`yarn lint`/`yarn build` 均乾淨。**Claude 沒有在瀏覽器實際看過徽章顏色/排版**，依專案 git 紀律停在工作目錄未 commit，等使用者本機看過分數/標籤/顏色是否合理（尤其淺色/深色兩種主題下 success/danger 顏色的對比度）再決定要不要調整配色或分數公式。 |
| 詳情頁 Google 資訊區塊（照片/評論/評分/營業時間/菜單連結） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-20（新一輪對話）使用者反映詳情頁資料太少，希望能看到 Google Maps 上會有的評論/照片/菜單，照片要縮圖、點擊放大 modal。用 `EnterPlanMode` 規劃後實作。**已確認的限制**：Google Places API（新版）沒有「菜單」欄位，官方不對外提供菜單內容——使用者確認做法：改成連結到 Google Maps 頁面，不在頁面內顯示菜單內容。**架構決策：不存 DB，每次開詳情頁即時打 Google API**（Google 對 Place Details 的照片/評論/評分等欄位有 30 天快取時限，即時抓最新資料最簡單也最符合條款；代價是每次開詳情頁都會有計費的 Google API 呼叫，已在計畫文件跟使用者說明這個持續性成本）。**Client 層**（`placesClient.ts` 擴充）：新增 `fetchPlaceDetails(placeId)` 打 Place Details API（field mask 含 rating/userRatingCount/priceLevel/regularOpeningHours/websiteUri/googleMapsUri/editorialSummary/photos/reviews），`parsePlaceDetailsResponse` 純函式解析＋zod schema 全欄位 optional。**實作前先用 DB 裡一個真實 placeId 實測打了一次 Place Details API 跟 Photo Media API**（用 curl，不是憑記憶假設欄位名稱），確認 `regularOpeningHours.weekdayDescriptions`／`reviews[].text.text`／`reviews[].authorAttribution`／`photos[].name`/`widthPx`/`heightPx` 這些欄位形狀，以及 Photo Media 端點是 302 redirect 到 `lh3.googleusercontent.com` 圖床，跟原本規劃的完全一致才動工寫 schema。Google 沒回 `googleMapsUri` 時自動組 fallback（`https://www.google.com/maps/place/?q=place_id:{placeId}`）。**安全考量**：Photo Media 端點的網址需要帶 API Key，不能直接讓瀏覽器打（會外洩 Key），新增 `src/app/api/place-photo/route.ts` 當同源代理，Key 留在伺服器端；`isValidPlacePhotoName` 用正規表示式驗證使用者可控的 `name` 參數格式，避免這個代理 route 變成任意網址代理（SSRF）的破口。**Service 層**：新增 `src/server/services/placeDetailsService.ts` 的 `getRestaurantPlaceDetails`（先查 `Restaurant.placeId`，沒有就直接回 `null`、不打 Google API），比照專案已踩過的「漏傳組合層參數」坑（已知的坑第 16 條）補了接線測試。tRPC 新增 `restaurant.placeDetails` procedure；新增 `useRestaurantPlaceDetails` hook，**故意跟 `useRestaurantDetail` 分開成獨立查詢**（Google API 有自己的延遲/失敗風險，掛掉也不該拖累頁面本來就能可靠顯示的核心資料）。**前端**：新增 `src/components/PlaceDetailsSection.tsx`（評分/價位/營業時間/官網連結/「在 Google Maps 上查看菜單與更多資訊」連結/照片縮圖格線/最多 5 則評論，loading 顯示文字、沒資料或查詢失敗時安靜不顯示整個區塊，不嚇到使用者）跟 `src/components/PhotoLightbox.tsx`（全螢幕遮罩，`Escape`/點背景/關閉按鈕都能關閉，多張照片時有上一張/下一張），純 `<img>` 標籤不用 `next/image`（大小已靠代理 route 的 `maxWidthPx` 參數控制，不需要 Next Image Optimization，也省去改 `next.config.ts`）。插入 `RestaurantDetailView.tsx` 的位置在既有基本資訊區塊之後、`SoloSeatReportForm`（眾包回報表單，這個 App 自己的核心價值）之前，回報表單維持在最下面不被擠開。單元測試新增 24 個（`placesClient.test.ts` 新增 `parsePlaceDetailsResponse`/`isValidPlacePhotoName`/`buildPlacePhotoMediaUrl`、`placeDetailsService.test.ts`、`priceLevel.test.ts`、`placePhotoUrl.test.ts`、`PhotoLightbox.test.tsx`、`PlaceDetailsSection.test.tsx` 全部新檔案，`RestaurantDetailView.test.tsx` 補一個渲染斷言），共 119 個全過；`tsc --noEmit`/`yarn lint`/`yarn build` 均乾淨。**Claude 沒有在瀏覽器實際看過縮圖排版/modal 放大互動/評論卡片樣式**，依專案 git 紀律停在工作目錄未 commit，等使用者本機開一間有 Google 資料的餐廳詳情頁測試：縮圖顯示、點擊開啟/關閉 modal、上一張下一張切換、評論/營業時間/菜單連結是否正確，深色/淺色主題下樣式是否清楚。 |
| 詳情頁改成 Google Maps 風格分頁按鈕（總覽/菜單/評論/單人友善/圖片） | ✅ 完成程式碼，⏸ 未在瀏覽器看過 | 2026-08-20（同一輪對話，接續上面「詳情頁 Google 資訊區塊」）使用者要求：頁面改成跟 Google Maps 一樣透過按鈕切換顯示不同資料，新增菜單/評論/單人友善/圖片等按鈕。用 `AskUserQuestion` 確認兩個資訊架構決策：(1) 評分/價位/營業時間/官網連結這些不屬於其他四類的基本資訊，新增一個「總覽」按鈕承接；(2) 預設開啟頁面顯示「總覽」（不是使用者原本推薦的「單人友善」——這是使用者的選擇，不是 Claude 自己的判斷）。對話中途使用者又追加「評論一樣顯示分頁按鈕」。**架構**：`RestaurantDetailView.tsx` 現在只保留最上面的識別資訊（店名/分類/地址/電話），下方是 5 顆分頁按鈕（`role="tab"`/`aria-selected`，樣式比照 `page.tsx` 既有的列表/地圖切換鈕），依 `activeTab` 狀態切換顯示內容：**單人友善**分頁的內容（單人座位狀態文字/友善度徽章/信心分數/回報表單 `SoloSeatReportForm`）直接由 `RestaurantDetailView.tsx` 自己渲染（用的是 `useRestaurantDetail` 這份我們自己的資料，不依賴 Google API，就算 Google 那邊掛掉這個分頁也要能正常顯示，這是這個 App 的核心價值不該被 Google 資料拖累）；其餘 4 個分頁（總覽/菜單/評論/圖片）委派給 `PlaceDetailsSection.tsx`，這個元件現在改吃一個新的 `activeTab` prop（型別 `PlaceDetailsTab`），只呼叫一次 `useRestaurantPlaceDetails`（避免切分頁時重複打 API），依 `activeTab` render 對應內容；查無資料/查詢失敗時**改成顯示一行「目前沒有更多資訊可顯示」的中性提示**（原本是完全不顯示任何東西，因為現在這個區塊有自己的分頁按鈕包著，完全空白會讓使用者以為按鈕壞了）。**評論分頁**：改成一次只顯示一則評論（`REVIEWS_PAGE_SIZE = 1`），搭配既有的 `Pagination.tsx` 元件切換——為了讓這個純函式能被「use client」元件直接用（不能讓前端元件伸手進 `server/services` 拿東西，破壞分層），把原本定義在 `restaurantSearchService.ts` 的泛型 `paginate<T>` 純函式搬到 `src/lib/pagination.ts`（跟同檔案裡的 `buildPaginationItems` 放一起，職責上都是「分頁」邏輯），`restaurantSearchService.ts` 改成 `import { paginate } from "@/lib/pagination"`，對應的單元測試也從 `restaurantSearchService.test.ts` 搬到 `pagination.test.ts`，函式行為完全沒變。單元測試新增/搬動共 7 個（`RestaurantDetailView.test.tsx` 新增 3 個分頁切換測試、`PlaceDetailsSection.test.tsx` 整份改寫成依 `activeTab` 分 4 個 describe 區塊＋評論分頁 2 個測試、`pagination.test.ts` 搬入原本 `paginate` 的 5 個測試），共 126 個全過；`tsc --noEmit`/`yarn lint`/`yarn build` 均乾淨，`grep -rn "zinc-\|bg-white\|text-white\|bg-black\|text-black" src/` 確認沒有新增的固定色階殘留（`PhotoLightbox.tsx` 的黑色遮罩維持既有例外）。**Claude 沒有在瀏覽器實際看過分頁按鈕的切換互動/樣式**，依專案 git 紀律停在工作目錄未 commit，等使用者本機測試：5 顆分頁按鈕點擊切換是否正常、預設是否停在總覽、單人友善分頁的回報表單是否正常運作、評論分頁顯示是否正確。**2026-08-20 追記兩次修正**：(1) 使用者回報「評論數量對不上，顯示總評論數跟實際的評論資料差很多」——根因是 `userRatingCount`（Google 上所有星等評分的總數，可能上千）跟 `reviews`（書面評論全文，API 最多只回傳 5 則精選）是兩個不同量級的東西，總覽分頁的文案原本寫「（5001 則評論）」讓使用者誤以為漏抓了其餘評論；已改成「Google 上共 5001 人評分」，評論分頁最上方也加一行說明＋連到 `googleMapsUri` 的連結，這個教訓記進「已知的坑」第 18 條。(2) 使用者接著指出「最多只顯示五則那就不需要用分頁直接全部顯示」——移除評論分頁的 `Pagination` 元件跟分頁狀態，改成 `data.reviews.map(...)` 一次全部顯示（本來就最多 5 則，用分頁反而多一道互動）；`paginate` 搬到 `src/lib/pagination.ts` 那個重構本身還是有效（`searchRestaurants` 那邊仍然需要），只是評論分頁不再是它的呼叫端。共 125 個測試全過（拿掉分頁互動測試少了 1 個），`tsc`/`lint`/`build` 均乾淨。 |
| 地圖檢視（Phase 2 第一項） | ✅ 完成程式碼＋**使用者已本機測試確認 OK**（2026-08-20） | 2026-08-20 使用者選定 Phase 2 優先做這項，用 `EnterPlanMode` 規劃後實作。**架構**：`findRestaurants`（Client 層）本來就是「依篩選條件撈全部符合資料、不分頁」，只是回傳型別沒帶 `lat`/`lng`——補上這兩個欄位後，Service 層抽出共用的 `fetchFilteredRestaurants`，`searchRestaurants`（清單，加 `paginate`）跟新的 `getRestaurantMapMarkers`（地圖，加 `toMapMarkers` 濾掉無座標資料）都呼叫同一個共用函式，避免兩處各自組 Client 參數重蹈「漏傳篩選欄位」的坑（呼應已知的坑第 16 條）。`searchRestaurantsInputSchema` 拆出共用的 `restaurantFilterInputSchema`（不含 `page`），新的 `restaurant.mapMarkers` tRPC procedure 重用它。**前端**：新增 `leaflet`/`react-leaflet`/`react-leaflet-cluster` 依賴；`src/components/RestaurantMap.tsx` 用 `MapContainer`+`TileLayer`（OpenStreetMap）+`MarkerClusterGroup`+`Marker`+`Popup`；marker 故意不用 Leaflet 預設 PNG icon（Next.js 打包常見的路徑 404 問題），改用 `L.divIcon` 畫依 `soloSeatStatus` 上色的圓點（綠/灰/橘），一眼看出單人座位可信度；popup 文字**刻意用固定深色**（`text-gray-900`），不是會翻轉的 `text-foreground`——因為 Leaflet popup 背景固定白色、不隨 App 深色模式翻轉，用會翻轉的文字色深色模式下會白字疊白底看不見（跟已知的坑第 10 條同類但方向相反的情況，新記一筆避免以後在 Leaflet popup 這種「有自己固定背景色的第三方元件內容」裡誤用主題 token）。首頁 `page.tsx` 加「列表/地圖」切換鈕，`RestaurantMap` 用 `next/dynamic({ssr:false})` 動態載入（避免 Leaflet 存取 `window` 在 SSR 階段噴錯），`useRestaurantMapMarkers` 只有切到地圖檢視時才會 `enabled: true` 打 API。單元測試新增 `toMapMarkers`/`getRestaurantMapMarkers`（含接線測試）、`RestaurantMap.test.tsx`（mock `react-leaflet`/`react-leaflet-cluster`，比照既有慣例避免在 jsdom 裡真的渲染地圖）、`HomePage.test.tsx` 新增列表/地圖切換互動測試，共 71 個全過。`yarn build` 確認 `/` 仍能靜態預渲染，SSR 沒有因為動態載入 Leaflet 而噴錯；`yarn lint` 乾淨。使用者本機測試地圖圖磚顯示、marker 顏色/聚合、popup 連結皆確認 OK。 |

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
17. **Leaflet `Popup` 的背景色是寫死的白色（來自 `leaflet.css`），不會跟著 App 的
    `bg-background`/`text-foreground` 深色模式 token 一起翻轉**：這跟已知的坑第 10 條
    「背景色寫死、文字忘記配對」方向相反——這次是「背景色被第三方套件寫死，我們自己的文字
    卻想用會翻轉的 token」，深色模式下 `text-foreground` 會是接近白色，疊在 Leaflet 固定白色
    的 popup 背景上就看不見。**教訓**：把 App 自己的 UI 元件跟「內容渲染在有自己固定樣式的
    第三方元件裡」（例如地圖 popup、第三方 modal/tooltip 套件的預設樣式）分開判斷——後者要
    看那個第三方元件的背景色是不是真的會跟著我們的主題 token 翻轉，不是看到自己專案有這組
    token 就到處套用。`src/components/RestaurantMap.tsx` 的 popup 內容目前用固定的
    `text-gray-900`/`text-gray-600`，不是 `text-foreground`。
18. **Google Places 的 `userRatingCount`（評分總數）跟 `reviews`（書面評論全文陣列）是兩個
    不同量級的東西，不要把前者當成後者的「總筆數」顯示**：2026-08-20 使用者回報「評論數量
    對不上，顯示總評論數跟實際的評論資料差很多」——`userRatingCount` 是 Google Maps 上
    「所有星等評分」的總數（可能上千筆，不需要使用者寫文字），但 Place Details API 的
    `reviews` 欄位不管 `userRatingCount` 多大，**最多只會回傳 5 則「精選」書面評論全文**，
    沒有分頁參數能拿到其餘的評論內容（這個限制在規劃階段就記錄過，見上方「詳情頁 Google
    資訊區塊」那一列，但當時 UI 文案沒有把這個落差講清楚，寫成「（5001 則評論）」讓使用者
    誤以為程式碼漏抓了其餘 4996 則）。**修法**：總覽分頁的文案改成「Google 上共 5001
    人評分」（用「評分」不是「評論」，語意上不再暗示這是書面評論筆數）；評論分頁最上方
    加一行明確說明「Google 只提供最多 5 則精選評論（Google 上共 X 人評分），完整評論請至
    Google Maps 查看」＋連到 `googleMapsUri` 的連結，讓使用者知道這不是 bug，是 Google
    公開 API 本身的限制，要看全部評論得去 Google Maps 本身。**教訓**：任何「總數」跟「實際
    可取得筆數」不一致的第三方 API 欄位，UI 文案要在數字旁邊講清楚這兩者的差異，不要讓使用者
    自己猜是不是我方漏抓資料。

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
8. ~~餐廳詳情頁、搜尋店名+行政區篩選、主題切換、NavBar SSR/hydration 修正、行政區地址驗證
   重新匯入~~ ✅ 2026-08-20 使用者本機測試全部確認 OK，見上方進度對照表
9. 手動標註前 10-20 間熟悉的店的 `soloSeatStatus`/`soloSeatType`，作為第一批可信資料
   （目前資料全是 `UNKNOWN`，篩選「僅顯示有單人座位」現在測起來會是空結果，這是預期的，
   不是 bug——可以先用 Prisma Studio `yarn db:studio` 手動改幾筆來測 UI）
10. ~~Phase 2：地圖檢視~~ ✅ 2026-08-20 完成，使用者已本機測試確認 OK（見上方進度對照表）
11. ~~Phase 2：眾包回報 UI + 輕量帳號系統（Google OAuth / Auth.js v5）~~ ✅ 2026-08-20
    程式碼完成，**使用者已申請 Google OAuth Client + 本機測試登入/回報流程確認 OK**，
    並行加上並行寫入 transaction 修正，見上方進度對照表完整清單
12. ~~Phase 2：「單人用餐友善度」專屬評分~~ 2026-08-20 程式碼完成，⏸ **等使用者本機瀏覽器
    看過首頁卡片/詳情頁的友善度徽章樣式與顏色才算數**（Phase 2 最後一項全部做完）——
    見上方進度對照表「單人用餐友善度」評分那一列
13. 手動標註前 10-20 間熟悉的店（見上方第 9 項，尚未做，可以搭配友善度徽章一起用
    Prisma Studio 手動測看看不同分數/標籤呈現效果）
14. Phase 3（即時空位、推薦系統）尚未規劃細節，等 Phase 2 全部使用者驗證過後再討論

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
