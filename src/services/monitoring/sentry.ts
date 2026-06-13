import { logger } from "@/utils/logger";

class SentryMonitor {
  private dsn: string | undefined;

  constructor() {
    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (this.dsn) {
      logger.info({
        service: "monitoring",
        event: "sentry_initialized",
        metadata: { dsn: this.dsn },
      });
    } else {
      logger.info({
        service: "monitoring",
        event: "sentry_disabled_no_dsn",
      });
    }
  }

  /**
   * Captures an error exception and registers it to the observability suite
   */
  captureException(error: any, context?: Record<string, any>) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error({
      service: "monitoring",
      event: "observability_exception",
      error: { message: errorMsg, stack: errorStack },
      metadata: context,
    });

    // In a real Sentry deployment, this runs:
    // Sentry.captureException(error, { extra: context });
  }

  /**
   * Captures a log message and pushes it to telemetry
   */
  captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info",
    context?: Record<string, any>
  ) {
    logger.info({
      service: "monitoring",
      event: "observability_message",
      metadata: { message, level, ...context },
    });

    // In a real Sentry deployment, this runs:
    // Sentry.captureMessage(message, level);
  }
}

export const sentryMonitor = new SentryMonitor();
