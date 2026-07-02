import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const GEO_PROMPT_RUNS_QUEUE = "geoPromptRunsQueue";
export const CONTENT_AUDIT_QUEUE = "contentAuditQueue";
export const REPORT_GENERATION_QUEUE = "reportGenerationQueue";
export const SLA_ALERTS_QUEUE = "slaAlertsQueue";

export function getGeoPromptRunsQueue() {
  return new Queue(GEO_PROMPT_RUNS_QUEUE, {
    connection: redisConnection,
  });
}

export function getContentAuditQueue() {
  return new Queue(CONTENT_AUDIT_QUEUE, {
    connection: redisConnection,
  });
}

export function getReportGenerationQueue() {
  return new Queue(REPORT_GENERATION_QUEUE, {
    connection: redisConnection,
  });
}

export function getSlaAlertsQueue() {
  return new Queue(SLA_ALERTS_QUEUE, {
    connection: redisConnection,
  });
}

