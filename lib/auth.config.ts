import type { NextAuthConfig } from "next-auth";

// Configuração "edge-safe" (sem Prisma/bcrypt) — usada pelo middleware.
// A configuração completa, com o provider de credenciais, fica em lib/auth.ts.
export const authConfig = {
  trustHost: true, // necessário em hosts fora da Vercel (ex: Netlify) para o NextAuth confiar no header Host
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isAuthPage) return isLoggedIn ? Response.redirect(new URL("/dashboard", request.nextUrl)) : true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
