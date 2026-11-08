import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { FLOW_SLUG } from "./src/lib/flow-path";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Word okuma (CV içe aktarma) Node'dan yüklensin; PDF için unpdf (sunucusuz uyumlu, paketlenebilir)
  serverExternalPackages: ["mammoth"],
  poweredByHeader: false,
  // Rehberli akış her dilde kendi adresiyle (/tr/basvuru, /sv/ansok …); sayfa dosyası /[locale]/akis
  async rewrites() {
    return { beforeFiles: Object.entries(FLOW_SLUG).map(([l, slug]) => ({ source: `/${l}/${slug}`, destination: `/${l}/akis` })), afterFiles: [], fallback: [] };
  },
  async redirects() {
    return [
      ...Object.entries(FLOW_SLUG).map(([l, slug]) => ({ source: `/${l}/akis`, destination: `/${l}/${slug}`, permanent: false })),
      // Grup gönderileri için kısa link: /g/sv-d → /sv?utm_…&utm_campaign=grupp-sv-d#testa (kayıtsız deneme)
      { source: "/g/:lang(sv|tr|en|de|es)-:id([a-z0-9-]+)", destination: "/:lang?utm_source=facebook&utm_medium=group&utm_campaign=grupp-:lang-:id#testa", permanent: false },
    ];
  },
  // Güvenlik başlıkları: başka sitede iframe'e gömülmeyi (clickjacking), MIME tahminini ve
  // gereksiz tarayıcı izinlerini engeller. script-src kısıtlaması yok (Next'in satır içi script'leri).
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com https://billing.stripe.com; upgrade-insecure-requests" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ],
    }];
  },
};

export default withNextIntl(nextConfig);
