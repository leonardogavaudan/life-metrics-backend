import { Hono } from "hono";
import { getUserById } from "../database/user";
import { jwtMiddleware, JwtPayload } from "../middleware/jwt";

export const usersRouter = new Hono();

usersRouter.get("/me", jwtMiddleware, async (c) => {
  const { id } = c.get("jwtPayload") as JwtPayload;

  const user = await getUserById(id);
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({ user });
});
