import { Hono } from "hono";

import { getUserById, deleteUserById } from "../../database/user/database.user";
import { jwtMiddleware, JwtPayload } from "../../middleware/jwt";

export const usersRouter = new Hono();

usersRouter.get("/me", jwtMiddleware, async (c) => {
  const { id } = c.get("jwtPayload") as JwtPayload;

  const user = await getUserById(id);
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({ user });
});

usersRouter.delete("/me", jwtMiddleware, async (c) => {
  const { id } = c.get("jwtPayload") as JwtPayload;

  const deleted = await deleteUserById(id);
  if (!deleted) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json({ message: "Account successfully deleted" }, 200);
});
