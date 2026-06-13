import { logger as baseLogger, LogPayload } from "@/utils/logger";
import { sentryMonitor } from "../monitoring/sentry";

/**
 * Enhanced Central Logger wrapper.
 * Forwards error logs automatically to the Sentry observability pipeline.
 */
export const logger = {
  info: (payload: LogPayload) => {
    baseLogger.info(payload);
  },

  warn: (payload: LogPayload) => {
    baseLogger.warn(payload);
  },

  error: (payload: LogPayload) => {
    baseLogger.error(payload);
    
    // Automatically report errors to Sentry Monitor
    sentryMonitor.captureException(payload.error || payload.event, {
      service: payload.service,
      trackerId: payload.trackerId,
      userId: payload.userId,
      ...payload.metadata,
    });
  },

  debug: (payload: LogPayload) => {
    baseLogger.debug(payload);
  },
};
