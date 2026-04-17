import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { NextRequest, NextResponse } from "next/server";

export const routing = defineRouting({
  locales: ["sv", "en", "es", "tr"],
  defaultLocale: "sv",
  localeDetection: true,
});

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin ve statik dosyaları middleware'den muaf tut
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next|_vercel).*)",
  ],
};
