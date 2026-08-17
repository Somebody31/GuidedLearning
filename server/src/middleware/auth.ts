// Optional password check.
// If AUTH_TOKEN is empty, anyone can call the API (good for local demo).

import type { MiddlewareHandler } from "hono";
import { env } from "../env";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  if (!env.AUTH_TOKEN) {
    await next();
    return;
  }

  const header = c.req.header("authorization") ?? "";
  let token = "";
  if (header.startsWith("Bearer ")) {
    token = header.slice(7);
  }

  if (token !== env.AUTH_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
