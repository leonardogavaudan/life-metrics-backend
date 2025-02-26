import { Context, Next } from "hono";
import { nanoid } from "nanoid";
import { contextStorage, createNewContext } from "../context/context";

export const requestContextMiddleware = async (_: Context, next: Next) => {
  const newContext = createNewContext({ requestId: nanoid() });
  await contextStorage.run(newContext, async () => {
    await next();
  });
};
