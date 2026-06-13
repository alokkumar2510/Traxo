type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  service:
    | "auth"
    | "firestore"
    | "storage"
    | "monitoring"
    | "scraping"
    | "notification"
    | "analytics"
    | "worker"
    | "ui";
  event: string;
  trackerId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

class CentralizedLogger {
  private formatLog(level: LogLevel, payload: LogPayload) {
    const logObject = {
      level,
      service: payload.service,
      event: payload.event,
      timestamp: new Date().toISOString(),
      ...(payload.trackerId ? { trackerId: payload.trackerId } : {}),
      ...(payload.userId ? { userId: payload.userId } : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
      ...(payload.error !== undefined && payload.error !== null
        ? {
            error:
              payload.error instanceof Error
                ? { message: payload.error.message, stack: payload.error.stack }
                : payload.error,
          }
        : {}),
    };

    if (process.env.NODE_ENV === "production") {
      // In production, output structured JSON for log processors
      return JSON.stringify(logObject);
    } else {
      // In development, output formatted and color-friendly messages for DX
      const serviceBadge = `[${payload.service.toUpperCase()}]`;
      const trackerInfo = payload.trackerId ? ` (Tracker: ${payload.trackerId})` : "";
      const errorMsg = payload.error
        ? `\n❌ Error: ${
            payload.error instanceof Error ? payload.error.message : String(payload.error)
          }`
        : "";
      return `${logObject.timestamp} ${level.toUpperCase().padEnd(5)} ${serviceBadge} ${payload.event}${trackerInfo}${errorMsg}`;
    }
  }

  info(payload: LogPayload) {
    console.info(this.formatLog("info", payload));
  }

  warn(payload: LogPayload) {
    console.warn(this.formatLog("warn", payload));
  }

  error(payload: LogPayload) {
    console.error(this.formatLog("error", payload));
  }

  debug(payload: LogPayload) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", payload));
    }
  }
}

export const logger = new CentralizedLogger();
