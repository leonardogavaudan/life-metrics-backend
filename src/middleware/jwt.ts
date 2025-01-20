import { Context, Next } from "hono";
import { jwt } from "hono/jwt";

const JWT_SECRET: string = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: string;
  email: string;
}

const verifyJwt = jwt({
  secret: JWT_SECRET,
});

export const jwtMiddleware = async (c: Context, next: Next) => {
  await verifyJwt(c, async () => {
    const payload = c.get("jwtPayload") as JwtPayload;
    c.set("user", payload);
    await next();
  });
};
