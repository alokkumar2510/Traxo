import { MiddlewareHandler } from "hono";
import { verifyFirebaseIdToken } from "../utils/jwks";
import { Bindings, Variables } from "../types";

export const authMiddleware = (): MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> => {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Missing or invalid Authorization header. Expected Bearer token.",
        },
        401
      );
    }

    const token = authHeader.substring(7);
    const projectId = c.env.FIREBASE_PROJECT_ID;

    try {
      const payload = await verifyFirebaseIdToken(token, projectId);
      
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
      
      await next();
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: "Unauthorized",
          message: error.message || "Invalid or expired token.",
        },
        401
      );
    }
  };
};
