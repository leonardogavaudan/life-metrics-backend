import { jwt } from "hono/jwt";

const JWT_SECRET: string = process.env.JWT_SECRET!;

export const jwtMiddleware = jwt({
  secret: JWT_SECRET,
});
