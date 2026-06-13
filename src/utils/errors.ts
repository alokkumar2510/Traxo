export class TraxoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends TraxoError {
  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "NETWORK_ERROR", statusCode, { ...metadata, url });
  }
}

export class ParsingError extends TraxoError {
  constructor(
    message: string,
    selector?: string,
    htmlSnippet?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "PARSING_ERROR", undefined, { ...metadata, selector, htmlSnippet });
  }
}

export class AuthenticationError extends TraxoError {
  constructor(message: string, provider?: string, metadata?: Record<string, unknown>) {
    super(message, "AUTHENTICATION_ERROR", 401, { ...metadata, provider });
  }
}

export class NotificationError extends TraxoError {
  constructor(
    message: string,
    channel: "email" | "telegram",
    metadata?: Record<string, unknown>
  ) {
    super(message, "NOTIFICATION_ERROR", undefined, { ...metadata, channel });
  }
}

export class ValidationError extends TraxoError {
  constructor(
    message: string,
    fields?: Record<string, string[]>,
    metadata?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", 400, { ...metadata, fields });
  }
}
