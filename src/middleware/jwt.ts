import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: string;
  email: string;
}

export async function jwtMiddleware(c: Context, next: Next) {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export function createProtectedRouter(router: any) {
  return {
    get: (path: string, handler: Function) =>
      router.get(path, jwtMiddleware, handler),
    post: (path: string, handler: Function) =>
      router.post(path, jwtMiddleware, handler),
    put: (path: string, handler: Function) =>
      router.put(path, jwtMiddleware, handler),
    delete: (path: string, handler: Function) =>
      router.delete(path, jwtMiddleware, handler),
  };
}
