import "dotenv/config";

import { Worker } from "bullmq";
import * as Sentry from "@sentry/nextjs";

import { redisConnection } from "@/lib/jobs/redis";
import {
  CONTENT_AUDIT_QUEUE,
  GEO_PROMPT_RUNS_QUEUE,
  REPORT_GENERATION_QUEUE,
  SLA_ALERTS_QUEUE,
} from "@/lib/jobs/queues";
import { runActiveQueriesForEngine, runTrackedQuery } from "@/lib/geo/runner";
import { aggregateVisibilityMetricsForDay } from "@/lib/geo/metrics";
import { runContentAuditForClient } from "@/lib/content/runContentAudit";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 0.2,
});

const geoWorker = new Worker(
  GEO_PROMPT_RUNS_QUEUE,
  async (job) => {
    if (job.name === "runTrackedQuery") {
      const { trackedQueryId, engineSlug } = job.data as {
        trackedQueryId: string;
        engineSlug: string;
      };
      return runTrackedQuery(trackedQueryId, engineSlug);
    }

    if (job.name === "runAllActiveQueries") {
      const { engineSlug } = job.data as { engineSlug: string };
      return runActiveQueriesForEngine(engineSlug);
    }

    if (job.name === "aggregateVisibilityDaily") {
      const { dateISO } = job.data as { dateISO?: string };
      const target = dateISO ? new Date(dateISO) : new Date();
      return aggregateVisibilityMetricsForDay(target);
    }

    throw new Error(`Unknown GEO job name: ${job.name}`);
  },
  { connection: redisConnection },
);

const contentAuditWorker = new Worker(
  CONTENT_AUDIT_QUEUE,
  async (job) => {
    if (job.name === "runClientAudit") {
      const { clientId } = job.data as { clientId: string };
      return runContentAuditForClient(clientId);
    }
    throw new Error(`Unknown content audit job: ${job.name}`);
  },
  { connection: redisConnection },
);

const reportWorker = new Worker(
  REPORT_GENERATION_QUEUE,
  async () => {
    return { ok: true };
  },
  { connection: redisConnection },
);

const slaWorker = new Worker(
  SLA_ALERTS_QUEUE,
  async () => {
    return { ok: true };
  },
  { connection: redisConnection },
);

for (const worker of [geoWorker, contentAuditWorker, reportWorker, slaWorker]) {
  worker.on("completed", (job) => {
    console.log(`[${worker.name}] completed job ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    Sentry.captureException(err, {
      tags: { worker: worker.name, jobName: job?.name ?? "unknown" },
      extra: { jobId: job?.id },
    });
    console.error(`[${worker.name}] failed job ${job?.id}`, err);
  });
}

console.log("GEO worker started.");

