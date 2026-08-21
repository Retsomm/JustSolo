-- 修正上一個 migration（20260821120000）留下的問題：舊測試帳號的 googleId 換成了
-- 佔位值，但 email 沒有一起換掉，導致這些帳號的本人下次用真實 Google 帳號登入時，
-- upsertUserByGoogleId 的 create 分支會撞上 email 的 UNIQUE constraint 而失敗。
-- 這裡把佔位帳號的 email 也一併換成不會衝突的佔位值，讓真實 email 空出來給下次
-- 真正登入時建立的新列使用。
UPDATE "User"
SET "email" = "googleId" || '@placeholder.invalid'
WHERE "googleId" LIKE 'legacy:%';
