import { NextResponse, type NextRequest } from "next/server";
import { isOpenAccessMode } from "@/lib/config";

const PUBLIC_ROUTES = ["/", "/login"];

export async function middleware(req: NextRequest) {
  if (isOpenAccessMode()) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const sessionCookie =
    req.cookies.get("sb-access-token")?.value ??
    req.cookies.get("supabase-auth-token")?.value;
  const hasSession = Boolean(sessionCookie);

  const { pathname, searchParams } = req.nextUrl;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/public");

  if (!hasSession && (pathname.startsWith("/app") || pathname.startsWith("/admin"))) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirectTo", pathname + searchParams.toString());
    return NextResponse.redirect(redirectUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (isPublicRoute) {
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

