import type { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-placeholder-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-placeholder-secret",
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID || "github-placeholder-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "github-placeholder-secret",
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");
      const isApiAuthPage = nextUrl.pathname.startsWith("/api/auth");
      const isCronPage = nextUrl.pathname.startsWith("/api/cron");
      const isPublicAsset = nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js)$/);

      if (isApiAuthPage || isCronPage || isPublicAsset) {
        return true;
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
