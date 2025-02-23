import { Hono } from "hono";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { integrationsRouter } from "./routes/integrations";
import { corsMiddleware } from "./middleware/cors";
import { requestContextMiddleware } from "./middleware/request_context";
import { setupCronJobs } from "./cron";
import { startConsumers } from "./consumers";
import { userPreferencesRouter } from "./routes/user-preferences/routes.user-preferences";

const app = new Hono();

app.use("*", requestContextMiddleware);
app.use("*", corsMiddleware);

app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/integrations", integrationsRouter);
app.route("/user-preferences", userPreferencesRouter);

setupCronJobs();
await startConsumers();

export default {
  port: 3000,
  fetch: app.fetch,
};
