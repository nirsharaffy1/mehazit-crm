import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname === "/login" ||
    req.nextUrl.pathname.startsWith("/forgot-password");

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
