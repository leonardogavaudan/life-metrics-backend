import { Context, Hono } from "hono";
import { jwtMiddleware, JwtPayload } from "../middleware/jwt";
import axios from "axios";
import {
  getIntegrationsByUserId,
  upsertIntegration,
  INTEGRATIONS,
  IntegrationProvider,
} from "../database/integration";
import {
  ApiIntegration,
  IntegrationStatus,
  OAUTH_CONFIGS,
  OAuthState,
  OAuthTokenResponse,
} from "./integrations/types";

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
  coros: {
    name: "COROS",
    description: "Track your training and performance with COROS integration",
    status: IntegrationStatus.ComingSoon,
  },
};

const integrationsRouter = new Hono();

integrationsRouter.use("*", jwtMiddleware);

const getRedirectUri = (c: Context, provider: IntegrationProvider) => {
  const isDevelopment = c.req.header("X-Environment") === "development";
  const baseUrl = isDevelopment
    ? "http://localhost:5173"
    : "https://app.lifemetrics.io";

  const config = OAUTH_CONFIGS[provider];
  if (!config)
    throw new Error(`OAuth config not found for provider: ${provider}`);

  return `${baseUrl}${config.redirectPath}`;
};

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

integrationsRouter.get("/oauth/authorize/:provider", async (c) => {
  const user = c.get("jwtPayload") as JwtPayload;
  const provider = c.req.param("provider") as IntegrationProvider;

  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    return c.json({ error: "Provider not supported" }, 400);
  }

  const state: OAuthState = {
    provider,
    userId: user.id,
    timestamp: Date.now(),
  };
  const encodedState = Buffer.from(JSON.stringify(state)).toString("base64");

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.append("client_id", config.clientId);
  authUrl.searchParams.append("redirect_uri", getRedirectUri(c, provider));
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", config.scope.join(" "));
  authUrl.searchParams.append("state", encodedState);

  return c.json({ url: authUrl.toString() });
});

integrationsRouter.post("/oauth/callback", async (c) => {
  const { code, state: encodedState } = await c.req.json();

  if (!code || !encodedState) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  try {
    const state: OAuthState = JSON.parse(
      Buffer.from(encodedState, "base64").toString()
    );

    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      return c.json({ error: "State expired" }, 400);
    }

    const config = OAUTH_CONFIGS[state.provider];
    if (!config) {
      return c.json({ error: "Provider not supported" }, 400);
    }

    const { data: tokens } = await axios.post<OAuthTokenResponse>(
      config.tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(c, state.provider),
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${config.clientId}:${config.clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope,
    };

    await upsertIntegration(state.userId, state.provider, credentials);

    return c.json({ success: true });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return c.json({ error: "Failed to complete OAuth flow" }, 500);
  }
});

export { integrationsRouter };
