import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {
    root: configDir,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
  },
);
