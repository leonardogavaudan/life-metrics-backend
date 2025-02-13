import { Hono } from "hono";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { integrationsRouter } from "./routes/integrations";
import { corsMiddleware } from "./middleware/cors";
import { requestContextMiddleware } from "./middleware/request_context";

const app = new Hono();

app.use("*", requestContextMiddleware)
app.use("*", corsMiddleware);

app.route("/auth", authRouter);
app.route("/users", usersRouter);
app.route("/integrations", integrationsRouter);

export default app;
