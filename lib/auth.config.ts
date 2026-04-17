import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe portion of the auth config. This is imported by `middleware.ts`,
 * which runs in the Edge runtime — so it cannot depend on Node APIs like
 * `bcryptjs` or the Drizzle/Neon clients. The Credentials provider and the
 * DrizzleAdapter live in `lib/auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "customer" | "admin") ?? "customer";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
