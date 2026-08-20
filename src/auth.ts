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
