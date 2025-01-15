import { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'

export const corsMiddleware = (): MiddlewareHandler => {
  return cors({
    origin: 'https://app.lifemetrics.io',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400, // 24 hours in seconds
    credentials: true
  })
}
