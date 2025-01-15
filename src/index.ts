import { Hono } from 'hono'
import { authRouter } from './routes/auth'
import { corsMiddleware } from './middleware/cors'

const app = new Hono()

app.use('*', corsMiddleware())

app.route('/auth', authRouter)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
