# JustSolo

一人友善餐廳搜尋 App。把「有沒有單人座位」變成可篩選、可信賴的資訊，讓內向者/單人用餐者
不用再賭運氣。涵蓋燒肉、中式、牛排、甜點店等所有餐飲分類，MVP 先聚焦台中市。

- 開發計畫（架構/資料模型/情境模擬）：[`docs/PLAN.md`](./docs/PLAN.md)
- 跨對話進度追蹤：[`PROGRESS.md`](./PROGRESS.md)（每次接續開發前先看這份）

## 技術棧

Next.js (App Router) + TypeScript + Tailwind CSS + tRPC + PostgreSQL + Prisma。
後端採 Client / Service / Hook 三層架構，FP 風格（`const` 箭頭函式，避免 class）。
測試：Vitest + React Testing Library + Playwright，AI 協作 TDD 開發模式。

## 本機開發環境設定

```bash
npm install                 # 會自動跑 postinstall: prisma generate
createdb justsolo_db        # 建立本機 PostgreSQL 資料庫（需先安裝並啟動 PostgreSQL）
cp .env.example .env        # 依本機帳號調整 DATABASE_URL
npx prisma migrate dev      # 套用 schema
npm run dev                 # http://localhost:3000
```

## 常用指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | Production build |
| `npm run test` | 跑 Vitest 單元/整合測試 |
| `npm run test:watch` | Vitest watch 模式 |
| `npm run e2e` | 跑 Playwright e2e（首次需 `npx playwright install`） |
| `npm run db:migrate` | 建立/套用 Prisma migration |
| `npm run db:studio` | 開 Prisma Studio 看資料庫 |

## 目錄結構

```
src/
  app/                       # Next.js App Router 頁面 + tRPC route handler
  hooks/                     # Hook 層：前端 custom hook（呼叫 tRPC）
  server/
    routers/                 # tRPC router（薄層，呼叫 Service）
    services/                # Service 層：FP 純函式業務邏輯
    clients/                 # Client 層：Prisma / 外部 API 封裝
  types/                     # zod schema + 共用型別
prisma/schema.prisma
tests/{unit,integration,e2e}/
docs/PLAN.md                 # 完整開發計畫
PROGRESS.md                  # 跨對話進度對照表
```
