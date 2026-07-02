import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./sentry.config";

if (process.env.NEXT_RUNTIME === "edge") {
  // Client config is not used in edge runtime.
} else if (sentryConfig.dsn && !Sentry.isInitialized()) {
  Sentry.init({
    ...sentryConfig,
  });
}

