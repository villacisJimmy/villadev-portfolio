import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: { typedRoutes: true },
  // Lint runs in CI (Phase I) — not during production build.
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
