-- email 僅作為顯示/聯絡用途，登入改以 googleId 為身分鍵（見 upsertUserByGoogleId），
-- 不再需要 email 唯一約束；保留約束反而會在不同 Google 帳號的 email 剛好相同時，
-- 讓登入時的 upsert 失敗。
DROP INDEX "User_email_key";
