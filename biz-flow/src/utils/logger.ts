import { Axiom } from "@axiomhq/js";
import { AsyncLocalStorage } from "async_hooks";

const token = process.env.AXIOM_TOKEN;
const dataset = process.env.AXIOM_DATASET || "backend-logs";

const axiom = token ? new Axiom({ token }) : null;

// Async storage for traceId and optional debug collector
export const tracingStorage = new AsyncLocalStorage<{ 
  traceId: string; 
  collector?: (data: any) => void;
}>();

if (!axiom) {
  console.warn("⚠️ AXIOM_TOKEN is missing. Logging will be console-only.");
}

/**
 * Structured Data for Logging
 */
export interface LogData {
  event: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Log an event to Axiom and also to the local console for observability.
 */
export const log = (data: LogData) => {
  const store = tracingStorage.getStore();
  const traceId = store?.traceId || "no-trace-id";

  const enrichedData = {
    ...data,
    traceId,
    timestamp: data.timestamp || new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };

  // 1. Log to Console for local dev visibility
  const consoleLevel = enrichedData.event.includes("error") ? "error" : "info";
  console[consoleLevel](
    `[${enrichedData.event}]`,
    JSON.stringify(enrichedData, null, 2),
  );

  // 2. Capture for collectors (like chat_debug.json)
  if (store?.collector) {
    store.collector(enrichedData);
  }

  // 3. Ingest to Axiom
  if (axiom) {
    try {
      axiom.ingest(dataset, [enrichedData]);
    } catch (err) {
      console.error("Failed to send log to Axiom:", err);
    }
  }
};

/**
 * Specific utility for error logging
 */
export const logError = (
  event: string,
  err: Error,
  userId?: string,
  metadata?: any,
) => {
  log({
    event,
    userId,
    errorMessage: err.message,
    stackTrace: err.stack,
    ...metadata,
  });
};

export default { log, logError };
