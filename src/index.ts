import { Hono } from "hono";
import { authRouter } from "./routes/auth/auth";
import { usersRouter } from "./routes/users/users";
import { integrationsRouter } from "./routes/integrations/integrations";
import { corsMiddleware } from "./middleware/cors";

const app = new Hono();

app.use("*", corsMiddleware());

app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/integrations", integrationsRouter);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
