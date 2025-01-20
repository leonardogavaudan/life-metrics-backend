import { Hono } from "hono";
import { jwtMiddleware, JwtPayload } from "../middleware/jwt";
import { getIntegrationsByUserId } from "../database/integration";

const integrationsRouter = new Hono();

integrationsRouter.use("*", jwtMiddleware);

integrationsRouter.get("/", async (c) => {
  const user = c.get("jwtPayload") as JwtPayload;
  const integrations = await getIntegrationsByUserId(user.id);

  return c.json({
    integrations,
  });
});

export { integrationsRouter };
