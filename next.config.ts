import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // PDF/Word okuma (CV içe aktarma) — pdfjs worker'ı paketlenince bozuluyor, Node'dan yüklensin
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default withNextIntl(nextConfig);
