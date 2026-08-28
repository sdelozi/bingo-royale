import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = ["/dashboard", "/group", "/groups", "/board"];
const authPages = ["/auth/signin", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET
  });

  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));

  if (isProtectedPath && !token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    signInUrl.searchParams.set("error", "auth_required");
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/group/:path*",
    "/groups/:path*",
    "/board/:path*",
    "/auth/signin",
    "/auth/register"
  ]
};
