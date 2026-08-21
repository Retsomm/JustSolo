@AGENTS.md

# JustSolo 專案規則

一人友善餐廳搜尋 App。**每次開新對話先讀根目錄 `PROGRESS.md`**（跨對話進度對照表），
架構/情境模擬等完整規劃在 `docs/PLAN.md`。不要重新從零規劃或重複討論已定案的技術棧決策
（見 `PROGRESS.md` 開頭的決策表）。

## Monorepo 結構（2026-08-21 起）

yarn workspaces：`apps/web`（Next.js 網頁版 + `auth.ts` + 2 個 API route）、`apps/mobile`
（Expo + EAS 手機版，Milestone 1 只做純瀏覽，不含登入）、`packages/shared`（純邏輯 + 型別 +
整個 tRPC server 層：`trpc.ts`/`routers/`/`services/`/`clients/`，含 Prisma）。

- **`packages/shared/src/pure/` 底下的檔案不能 import 任何 `server/clients/*`**——
  `apps/mobile` 只 value-import `packages/shared` 的安全 barrel（`pure/`＋`types/`），
  `AppRouter` 只能用 `import type` 從 `server/routers/_app` 拿型別，絕對不能讓
  Prisma/`pg` 這類 Node-only 依賴被 Metro bundle 進手機 App。新增任何 Service 層純函式，
  如果未來手機版可能會用到，直接寫進 `packages/shared/src/pure/`，不要跟 DB-dependent
  的組合層函式混在同一個檔案（詳見 `PROGRESS.md`「已知的坑」第 19 條的完整原理）。
- **`packages/shared/src/` 底下（會被其他 workspace 深路徑 import 到的檔案）內部一律用
  relative import（`../types/x`），不要用 `@/` alias**——因為只要 `apps/web`/`apps/mobile`
  deep-import 了這裡的任何檔案，那個檔案就會被塞進消費端自己的 TypeScript program，用
  消費端自己的 `@/*` alias（指向消費端自己的 `src/`）解析，跟 `packages/shared` 自己的
  alias 完全無關，會直接炸出 `Cannot find module` 系列錯誤（詳見「已知的坑」第 19 條）。
  只有 `packages/shared/tests/unit/*.test.ts`（只會被 `packages/shared` 自己單獨編譯）
  可以繼續用 `@/`。
- next-auth 的 `Session`/`JWT` 型別擴充（`next-auth.d.ts`）**三個 workspace 各自要有一份**
  （`apps/web/src/types/`、`apps/mobile/src/types/`、`packages/shared/src/types/`）——
  ambient 型別擴充只在它所屬的 TypeScript program 裡生效，任何一個 workspace 的 program
  只要拉進了 `packages/shared/src/server/trpc.ts`（`protectedProcedure` 用到
  `ctx.session.user.id`），沒有這份擴充就會出現 `Session.user' is possibly 'undefined'`
  系列錯誤（詳見「已知的坑」第 20 條）。
- 手機版跟網頁版遇到「不同 workspace 需要不同版本的同一個套件」（例如 React）時，先查那個
  套件的 peer dependency range 是否其實相容，優先用根目錄 `package.json` 的
  `"resolutions"` 收斂成單一版本，不要直接跳去 yarn 的 `nohoist`（這個組合在本專案的
  workspace 互相依賴圖形下會讓 `yarn install` 直接炸掉，詳見「已知的坑」第 21 條）。

## 架構鐵律（`apps/web` 與 `packages/shared` 內部通用）

- 後端固定 **Client / Service / Hook** 三層：Client（`clients/`，純 I/O）→
  Service（`services/`，FP 純函式業務邏輯，組合 Client）→ Hook
  （`apps/web/src/hooks/`，前端 React hook，呼叫 tRPC）。API 層用 tRPC（`routers/`）。
  Client/Service/routers 現在都在 `packages/shared/src/server/` 底下；Hook 留在
  `apps/web/src/hooks/`（`apps/mobile/src/hooks/` 是手機版自己的一套，各自對應同一份
  `AppRouter`，不跨 app 共用 hook 本身，只共用型別/純邏輯）。
- 全部 `const foo = (...) => {...}` 箭頭函式，不用 class，優先 map/filter/reduce，不 mutate。
- Service 層要能不連 DB 就單元測試——業務邏輯寫成純函式（輸入輸出明確，放
  `packages/shared/src/pure/`），組合 Client 呼叫的部分另外拆一層薄的 composition
  function（參考 `packages/shared/src/pure/restaurantFriendliness.ts` 的
  `filterAndSortBySoloSeat` vs `packages/shared/src/server/services/restaurantSearchService.ts`
  的 `searchRestaurants`）。

## Prisma 7 已知地雷（不要重踩，詳見 PROGRESS.md「已知的坑」）

- Client 層的 PrismaClient **不能在 module 頂層直接 `new`**，要用 lazy singleton
  （`getPrisma()`），否則連只測純函式、完全不碰 DB 的單元測試都會因為 transitively
  import 到而炸掉。
- `import { PrismaClient } from "@/generated/prisma/client"`，不是 `"@/generated/prisma"`
  （這個 generator 沒有 `index.ts`）。
- 建立 PrismaClient 必須帶 driver adapter（`@prisma/adapter-pg` 的 `PrismaPg`），
  不能 `new PrismaClient()` 不帶參數。

## Git 紀律

沿用使用者全域規則（`~/.claude/CLAUDE.md`）：**沒有使用者親自驗證過的修改
（尤其是需要瀏覽器操作確認的 UI/功能行為），不要主動 `git commit`**。
純環境設定/設定檔/schema/能在本地跑 build+test+typecheck 驗證的改動可以直接 commit+push；
一旦碰到「使用者才能驗證」的部分，改完停在工作目錄，明確告知等使用者測過再 commit。

Monorepo 下的完整驗證指令（根目錄執行）：`yarn typecheck`（三個 workspace 都跑）、
`yarn test`（`apps/web` + `packages/shared`，`apps/mobile` 目前沒有自己的測試）、
`yarn lint`、`yarn build`。手機版沒有模擬器/實機可以驗證的部分（畫面/互動/效能）
一律屬於「使用者才能驗證」，`npx expo export --platform ios`（不需要模擬器）只能驗證
Metro 打包本身有沒有炸掉，不能當作「功能正確」的證明。
