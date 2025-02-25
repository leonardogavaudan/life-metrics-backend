import { Hono } from "hono";
import { authRouter } from "./routes/auth/routes.auth";
import { usersRouter } from "./routes/users/routes.users";
import { integrationsRouter } from "./routes/integrations/routes.integrations";
import { corsMiddleware } from "./middleware/cors";
import { requestContextMiddleware } from "./middleware/request_context";
import { setupCronJobs } from "./cron";
import { startConsumers } from "./consumers";
import { userPreferencesRouter } from "./routes/user-preferences/routes.user-preferences";
import { metricsRouter } from "./routes/metrics/routes.metrics";

const app = new Hono();

app.use("*", requestContextMiddleware);
app.use("*", corsMiddleware);

app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/integrations", integrationsRouter);
app.route("/user-preferences", userPreferencesRouter);
app.route("/metrics", metricsRouter);

app.onError((err, c) => {
  console.error("Error message:", err.message);
  if (err instanceof Error && err.stack) {
    console.error("Stack trace:", err.stack);
  }
  if ("originalError" in err && err.originalError) {
    console.error("Original Postgres error:", err.originalError);
  }
  if ("args" in err && err.args) {
    console.error("Query arguments:", err.args);
  }
  return c.text("Internal Server Error", 500);
});

setupCronJobs();
await startConsumers();

export default {
  port: 3000,
  fetch: app.fetch,
};
