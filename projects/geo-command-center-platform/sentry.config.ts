export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  debug: process.env.NODE_ENV === "development",
};

export const sentryTunnelRoute = "/monitoring";

