import { Hono } from "hono";
import { jwtMiddleware, JwtPayload } from "../middleware/jwt";
import {
  getIntegrationsByUserId,
  INTEGRATIONS,
  IntegrationProvider,
} from "../database/integration";
import { ApiIntegration, IntegrationStatus } from "./integrations/types";

const INTEGRATION_DETAILS: Record<
  IntegrationProvider,
  { name: string; description: string }
> = {
  strava: {
    name: "Strava",
    description:
      "Connect your Strava account to track your running and cycling activities",
  },
  fitbit: {
    name: "Fitbit",
    description: "Sync your Fitbit data to track steps, sleep, and activity",
  },
  oura: {
    name: "Oura Ring",
    description: "Import your sleep and recovery data from Oura Ring",
  },
  apple_health: {
    name: "Apple Health",
    description:
      "Sync your Apple Health data for comprehensive health tracking",
  },
  garmin: {
    name: "Garmin",
    description: "Connect your Garmin device to track your fitness activities",
  },
};

const integrationsRouter = new Hono();

integrationsRouter.use("*", jwtMiddleware);

integrationsRouter.get("/", async (c) => {
  const user = c.get("jwtPayload") as JwtPayload;
  const connectedIntegrations = await getIntegrationsByUserId(user.id);

  const connectedProviders = new Set(
    connectedIntegrations.map((i) => i.provider)
  );

  const transformedConnectedIntegrations: ApiIntegration[] =
    connectedIntegrations.map((integration) => ({
      id: integration.id,
      provider: integration.provider,
      name: INTEGRATION_DETAILS[integration.provider].name,
      description: INTEGRATION_DETAILS[integration.provider].description,
      status: IntegrationStatus.Connected,
    }));

  const availableIntegrations: ApiIntegration[] = (
    Object.keys(INTEGRATIONS) as IntegrationProvider[]
  )
    .filter((provider) => !connectedProviders.has(provider))
    .map((provider) => ({
      id: null,
      provider,
      name: INTEGRATION_DETAILS[provider].name,
      description: INTEGRATION_DETAILS[provider].description,
      status: IntegrationStatus.Available,
    }));

  return c.json({
    integrations: [
      ...transformedConnectedIntegrations,
      ...availableIntegrations,
    ],
  });
});

export { integrationsRouter };
