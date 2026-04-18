import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { NextRequest, NextResponse } from "next/server";

export const routing = defineRouting({
  locales: ["sv", "en", "es", "tr"],
  defaultLocale: "sv",
  localeDetection: true,
});

const intlMiddleware = createMiddleware(routing);

const LOCALES = ["sv", "en", "es", "tr"];

// Map Vercel x-vercel-ip-country → locale
const COUNTRY_LOCALE: Record<string, string> = {
  SE: "sv",
  TR: "tr",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  US: "en", GB: "en", AU: "en", CA: "en", NZ: "en", IE: "en", ZA: "en", IN: "en",
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Country detection: only for paths without a locale prefix and no saved preference
  const hasLocalePrefix = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!hasLocalePrefix && !req.cookies.has("NEXT_LOCALE")) {
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const locale = COUNTRY_LOCALE[country];
    if (locale) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.redirect(url);
      res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel).*)"],
};
