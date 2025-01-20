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
  { name: string; description: string; status: IntegrationStatus }
> = {
  whoop: {
    name: "Whoop",
    description:
      "Track your strain, recovery, and sleep with Whoop integration",
    status: IntegrationStatus.ComingSoon,
  },
  fitbit: {
    name: "Fitbit",
    description: "Sync your Fitbit data to track steps, sleep, and activity",
    status: IntegrationStatus.ComingSoon,
  },
  oura: {
    name: "Oura Ring",
    description: "Import your sleep and recovery data from Oura Ring",
    status: IntegrationStatus.Available,
  },
  apple_health: {
    name: "Apple Health",
    description:
      "Sync your Apple Health data for comprehensive health tracking",
    status: IntegrationStatus.ComingSoon,
  },
  garmin: {
    name: "Garmin",
    description: "Connect your Garmin device to track your fitness activities",
    status: IntegrationStatus.ComingSoon,
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
      status: INTEGRATION_DETAILS[provider].status,
    }));

  return c.json({
    integrations: [
      ...transformedConnectedIntegrations,
      ...availableIntegrations,
    ],
  });
});

export { integrationsRouter };
