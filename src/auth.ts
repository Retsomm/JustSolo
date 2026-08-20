import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { registerOrUpdateUser } from "@/server/services/authService";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // 個人頁面的名稱/大頭貼修改故意不同步回 session/JWT：JWT session 策略會把
    // 整個 token 序列化進 cookie，大頭貼是裁切後的 base64 data URL
    // （見 imageCrop.ts），可能有數十 KB，塞進 cookie 會讓瀏覽器對這個 origin
    // 的「所有」後續請求都因為 cookie 太大被伺服器拒絕（431 Request Header
    // Fields Too Large，連最基本的首頁 GET 請求都會壞掉——這是真實踩過的坑，
    // 不是預防性假設）。名稱/大頭貼一律直接查 DB（`user.getProfile`），
    // 不透過 session/token 傳遞。
    async jwt({ token, profile }) {
      if (profile?.email) {
        const user = await registerOrUpdateUser({
          email: profile.email,
          name: profile.name ?? null,
          image: typeof profile.picture === "string" ? profile.picture : null,
        });
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
