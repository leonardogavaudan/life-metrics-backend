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
  console.error("Error:", err.message);

  if (err.name === "DatabaseError") {
    console.error("Database Error Details:");
    // @ts-ignore
    console.error("  Query:", err.query || "Unknown");
    // @ts-ignore
    console.error("  Parameters:", err.params || []);

    // @ts-ignore
    if (err.callerStack) {
      console.error("Application Stack:");
      // @ts-ignore
      console.error(err.callerStack);
    }

    // @ts-ignore
    if (err.originalError) {
      // @ts-ignore
      console.error("Original Error:", err.originalError.message);
      // @ts-ignore
      if (err.originalError.code) {
        // @ts-ignore
        console.error("Error Code:", err.originalError.code);
      }
    }
  } else {
    console.error("Stack trace:", err.stack || "No stack trace available");
  }

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
