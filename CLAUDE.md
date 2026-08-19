@AGENTS.md

# JustSolo 專案規則

一人友善餐廳搜尋 App。**每次開新對話先讀根目錄 `PROGRESS.md`**（跨對話進度對照表），
架構/情境模擬等完整規劃在 `docs/PLAN.md`。不要重新從零規劃或重複討論已定案的技術棧決策
（見 `PROGRESS.md` 開頭的決策表）。

## 架構鐵律

- 後端固定 **Client / Service / Hook** 三層：Client（`src/server/clients/`，純 I/O）→
  Service（`src/server/services/`，FP 純函式業務邏輯，組合 Client）→ Hook
  （`src/hooks/`，前端 React hook，呼叫 tRPC）。API 層用 tRPC（`src/server/routers/`）。
- 全部 `const foo = (...) => {...}` 箭頭函式，不用 class，優先 map/filter/reduce，不 mutate。
- Service 層要能不連 DB 就單元測試——業務邏輯寫成純函式（輸入輸出明確），
  組合 Client 呼叫的部分另外拆一層薄的 composition function（參考
  `restaurantSearchService.ts` 的 `filterAndSortBySoloSeat` vs `searchRestaurants`）。

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
