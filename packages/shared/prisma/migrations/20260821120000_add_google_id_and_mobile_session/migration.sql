-- CreateTable
CREATE TABLE "MobileSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MobileSession_userId_idx" ON "MobileSession"("userId");

-- AddForeignKey
ALTER TABLE "MobileSession" ADD CONSTRAINT "MobileSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;

-- 這個專案目前只有開發者自己的測試帳號（pre-launch，尚無真實使用者），沒有對應的
-- 真實 Google sub 可回填；下次用同一個 Google 帳號登入時會依真實 sub upsert 出
-- 新的 User 列，這批舊測試資料的 googleId 只是暫時佔位，不影響正確性。
UPDATE "User" SET "googleId" = 'legacy:' || "id" WHERE "googleId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "googleId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
