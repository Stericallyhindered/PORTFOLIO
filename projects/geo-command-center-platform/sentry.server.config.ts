import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./sentry.config";

if (!Sentry.isInitialized()) {
  Sentry.init({
    ...sentryConfig,
  });
}

