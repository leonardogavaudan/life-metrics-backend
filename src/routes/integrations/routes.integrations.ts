import { Context, Hono } from "hono";
import {
  jwtValidationMiddleware,
  JwtPayload,
} from "../../middleware/middleware.jwt";
import axios from "axios";
import {
  softDeleteIntegrationById,
  getIntegrationsByUserId,
  upsertIntegration,
} from "../../database/integration/database.integration";
import { Integration } from "../../database/integration/database.integration.types";
import {
  OAUTH_CONFIGS,
  OAuthState,
  OAuthTokenResponse,
} from "./routes.integration.types";
import { IntegrationProvider } from "../../types/types.provider";
import { IntegrationDetails } from "../../types/types.integrations";
import { IntegrationStatus } from "../../types/types.integrations";
import { IntegrationProviders } from "../../types/types.provider";

export const integrationsRouter = new Hono();

integrationsRouter.use("*", jwtValidationMiddleware);

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
    connectedIntegrations.map((i: Integration) => i.provider)
  );

  const transformedConnectedIntegrations = connectedIntegrations.map(
    (integration: Integration) => ({
      id: integration.id,
      provider: integration.provider,
      name: IntegrationDetails[integration.provider].name,
      description: IntegrationDetails[integration.provider].description,
      status: IntegrationStatus.Connected,
    })
  );

  const availableIntegrations = Object.values(IntegrationProviders)
    .filter((provider) => !connectedProviders.has(provider))
    .map((provider) => ({
      id: null,
      provider,
      name: IntegrationDetails[provider].name,
      description: IntegrationDetails[provider].description,
      status: IntegrationDetails[provider].status,
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
      token_type: tokens.token_type,
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

integrationsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await softDeleteIntegrationById(id);
  return c.body(null, 204);
});
