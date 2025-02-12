import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { contextStorage, createNewContext } from "../context";
import { z } from "zod";
import { every } from "hono/combine";

const JwtPayload = z.object({
  id: z.string(),
  email: z.string()
})
export type JwtPayload = z.infer<typeof JwtPayload>

export const JwtContext = z.object({
  user: JwtPayload
})
export type JwtContext = z.infer<typeof JwtContext>

const JWT_SECRET: string = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("Missing JWT SECRET");
}

export const jwtContextMiddleware = async (c: Context, next: Next) => {
  const payload = c.get("jwtPayload") as JwtPayload;
  console.log("logging hono context", c)
  const jwtContext = createNewContext({ user: payload });
  await contextStorage.run(jwtContext, async () => {
    await next();
  });
};

export const jwtValidationMiddleware = jwt({ secret: JWT_SECRET });

export const jwtMiddleware = every(
  jwtContextMiddleware, jwtValidationMiddleware
)
