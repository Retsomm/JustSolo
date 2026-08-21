# JustSolo

一人友善餐廳搜尋 App。把「有沒有單人座位」變成可篩選、可信賴的資訊，讓內向者/單人用餐者
不用再賭運氣。涵蓋燒肉、中式、牛排、甜點店等所有餐飲分類，MVP 先聚焦台中市。

- 開發計畫（架構/資料模型/情境模擬）：[`docs/PLAN.md`](./docs/PLAN.md)
- 跨對話進度追蹤：[`PROGRESS.md`](./PROGRESS.md)（每次接續開發前先看這份）

## 技術棧

yarn workspaces monorepo：

- `apps/web`：Next.js (App Router) + TypeScript + Tailwind CSS，網頁版前端 + auth。
- `apps/mobile`：Expo + EAS，手機版（RN），Milestone 1 只做純瀏覽，不含登入。
- `packages/shared`：tRPC + PostgreSQL + Prisma，兩個 App 共用的純邏輯/型別/整個後端。

後端採 Client / Service / Hook 三層架構，FP 風格（`const` 箭頭函式，避免 class）。
測試：Vitest + React Testing Library（不用 Playwright/瀏覽器 e2e，UI 驗證是使用者自己的
範圍，見 `PROGRESS.md`），AI 協作 TDD 開發模式。

## 本機開發環境設定

```bash
yarn install                 # 會自動跑 packages/shared 的 postinstall: prisma generate
createdb justsolo_db         # 建立本機 PostgreSQL 資料庫（需先安裝並啟動 PostgreSQL）
cp .env.example .env         # 依本機帳號調整 DATABASE_URL（.env 放在 repo 根目錄，兩個 workspace 共用）
yarn db:migrate               # 套用 schema
yarn dev                      # 啟動網頁版，http://localhost:3000
yarn mobile                   # 啟動手機版 Expo dev server（另開一個終端機視窗）
```

## 常用指令（根目錄執行，會 proxy 到對應 workspace）

| 指令 | 用途 |
|---|---|
| `yarn dev` | 啟動網頁版開發伺服器（`apps/web`） |
| `yarn mobile` | 啟動手機版 Expo dev server（`apps/mobile`） |
| `yarn build` | 網頁版 production build |
| `yarn test` | 跑 `apps/web` + `packages/shared` 的 Vitest 單元/整合測試 |
| `yarn typecheck` | 三個 workspace 的 `tsc --noEmit` |
| `yarn lint` | 網頁版 ESLint |
| `yarn db:migrate` | 建立/套用 Prisma migration（`packages/shared`） |
| `yarn db:studio` | 開 Prisma Studio 看資料庫 |
| `yarn import:restaurants` | 跑 Google Places 匯入腳本 |

單一 workspace 的指令：`yarn workspace @justsolo/web <script>`／
`yarn workspace @justsolo/mobile <script>`／`yarn workspace @justsolo/shared <script>`。

## 目錄結構

```
apps/web/
  src/
    app/                       # Next.js App Router 頁面 + tRPC/auth route handler
    hooks/                     # Hook 層：網頁版前端 custom hook（呼叫 tRPC）
    components/                # 網頁版 React 元件
    lib/                       # 網頁版專屬邏輯（theme、imageCrop、trpc client wiring）
  tests/{unit,integration}/
apps/mobile/
  src/
    app/                       # expo-router file-based routes
    hooks/                     # 手機版自己的 custom hook（呼叫同一個 AppRouter）
    components/                # 手機版 React Native 元件
    lib/                       # 手機版專屬邏輯（apiBaseUrl、trpc client wiring）
  app.json / eas.json / metro.config.js
packages/shared/
  src/
    pure/                      # 零依賴純函式（兩個 App 都可以 value-import）
    types/                     # zod schema + 共用型別
    server/
      trpc.ts                  # tRPC context/procedure 定義
      routers/                 # tRPC router（薄層，呼叫 Service）
      services/                # Service 層：FP 純函式業務邏輯 + DB 組合層
      clients/                 # Client 層：Prisma / 外部 API 封裝
  prisma/schema.prisma
  scripts/import-restaurants.ts
  tests/unit/
docs/PLAN.md                   # 完整開發計畫
PROGRESS.md                    # 跨對話進度對照表
```
