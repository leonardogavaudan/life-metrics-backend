import { Context, Next } from "hono"
import { nanoid } from "nanoid"
import { contextStorage, createNewContext } from "../context"

export const requestContextMiddleware = async (_: Context, next: Next) => {
  const newContext = createNewContext({ requestId: nanoid() })
  contextStorage.run(
    newContext, async () => {
      await next()
    }
  )
}
