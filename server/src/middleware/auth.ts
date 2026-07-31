import type { MiddlewareHandler } from "hono";
import { env } from "../env";

/**
 * Alpha auth: if AUTH_TOKEN is set, require Bearer match.
 * If unset, allow all (local demo).
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  if (!env.AUTH_TOKEN) {
    await next();
    return;
  }
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== env.AUTH_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
