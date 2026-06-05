import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/signup", "/forgot-password"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  const authToken = req.cookies.get("auth-token")?.value;
  const isAuthenticated = !!authToken;

  if (isPublic && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublic && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
