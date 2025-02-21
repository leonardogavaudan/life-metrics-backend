import { Hono } from "hono";
import { jwtMiddleware } from "../../middleware/jwt";

export const userPreferencesRouter = new Hono();

userPreferencesRouter.get("/", jwtMiddleware, (c) => {
  return c.json({});
});
