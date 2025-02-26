import { Hono } from "hono";
import { startConsumers } from "./consumers";
import { setupCronJobs } from "./cron";
import { isDatabaseError } from "./database/database.error";
import { corsMiddleware } from "./middleware/cors";
import { requestContextMiddleware } from "./middleware/request_context";
import { authRouter } from "./routes/auth/routes.auth";
import { integrationsRouter } from "./routes/integrations/routes.integrations";
import { metricsRouter } from "./routes/metrics/routes.metrics";
import { userPreferencesRouter } from "./routes/user-preferences/routes.user-preferences";
import { usersRouter } from "./routes/users/routes.users";

const app = new Hono();

app.use("*", requestContextMiddleware);
app.use("*", corsMiddleware);

app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/integrations", integrationsRouter);
app.route("/user-preferences", userPreferencesRouter);
app.route("/metrics", metricsRouter);

app.onError((err, c) => {
  console.error("Error:", err.message);

  // Create a structured error log with relevant information
  const errorLog: Record<string, any> = {
    message: err.message,
    type: err.name,
    stack: err.stack || "No stack trace available",
  };

  // Add database-specific error details if available
  if (isDatabaseError(err)) {
    Object.assign(errorLog, {
      query: err.query || "Unknown",
      params: err.params || [],
      callerStack: err.callerStack || null,
      originalError: err.originalError
        ? {
            message: err.originalError.message,
            code: err.originalError.code,
          }
        : null,
    });
  }

  // Log the structured error
  console.error("Error details:", JSON.stringify(errorLog, null, 2));

  // Return appropriate response based on environment
  if (process.env.NODE_ENV === "development") {
    return c.json(
      {
        error: err.message,
        type: err.name,
        stack: err.stack?.split("\n").slice(0, 5),
      },
      500
    );
  }

  return c.text("Internal Server Error", 500);
});

setupCronJobs();
await startConsumers();

export default {
  port: 3000,
  fetch: app.fetch,
};
