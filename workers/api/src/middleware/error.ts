import { ErrorHandler } from "hono";

export const errorHandler = (): ErrorHandler => {
  return (err, c) => {
    console.error(`[Error Handler] Details:`, err);

    let status = 500;
    let message = "An internal server error occurred.";
    let code = "INTERNAL_SERVER_ERROR";

    // Standardize error responses
    if (err.name === "ZodError") {
      status = 400;
      message = "Validation failed.";
      code = "VALIDATION_ERROR";
      return c.json(
        {
          success: false,
          error: {
            code,
            message,
            details: (err as any).errors || (err as any).issues,
          },
        },
        status as any
      );
    }

    if (err.message && err.message.includes("not found")) {
      status = 404;
      message = err.message;
      code = "NOT_FOUND";
    } else if (err.message && err.message.includes("permission denied")) {
      status = 403;
      message = "Access denied.";
      code = "PERMISSION_DENIED";
    } else if (err.message && err.message.includes("Unauthorized")) {
      status = 401;
      message = err.message;
      code = "UNAUTHORIZED";
    }

    return c.json(
      {
        success: false,
        error: {
          code,
          message,
        },
      },
      status as any
    );
  };
};
