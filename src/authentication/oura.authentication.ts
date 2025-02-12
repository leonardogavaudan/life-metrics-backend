import { getContextWithValidation } from "../context";
import axios, { AxiosError } from "axios";
import { JwtContext } from "../middleware/jwt";
import { getIntegrationByUserIdAndProvider, updateIntegrationCredentials } from "../database/integration";
import { IntegrationProvider, OAuthCredentials } from "../database/integration/types";

const ouraClient = axios.create({
  baseURL: "https://api.ouraring.com/v2/"
})

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID
if (!OURA_CLIENT_ID) {
  throw new Error("Missing Oura client id")
}

const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET
if (!OURA_CLIENT_SECRET) {
  throw new Error("Missing Oura client secret")
}

ouraClient.interceptors.request.use(async (config) => {
  if (config.headers?.Authorization) return config;

  const jwtCtx = getContextWithValidation(JwtContext);
  if (!jwtCtx.success) throw new Error("No jwt context");

  const integration = await getIntegrationByUserIdAndProvider(
    jwtCtx.data.user.id,
    IntegrationProvider.Oura
  );
  if (!integration) throw new Error("Integration not found");

  const parsed = OAuthCredentials.safeParse(integration.credentials);
  if (!parsed.success) throw new Error("Invalid credentials");

  config.headers.set("Authorization", `Bearer ${parsed.data.access_token}`);

  return config;
});

ouraClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  if (!error.response) throw error

  if (error.response.status === 401) {
    const config = error.config;
    if (!config) throw new Error("No config found")
    const newAccessToken = await refreshTokens()
    config.headers.set("Authorization", `Bearer ${newAccessToken}`);
    return ouraClient.request(config)
  }

  throw error
})


type OuraPostOAuthTokenResponse = {
  token_type: string,
  access_token: string,
  expires_in: number, // Seconds
  refresh_token: string,
}

async function refreshTokens() {
  const jwtCtx = getContextWithValidation(JwtContext)
  if (!jwtCtx.success) throw new Error("No jwt context")

  const integration = await getIntegrationByUserIdAndProvider(
    jwtCtx.data.user.id,
    IntegrationProvider.Oura
  )
  if (!integration) throw new Error("Integration not found")

  const parsed = OAuthCredentials.safeParse(integration.credentials)
  if (!parsed.success) throw new Error("Invalid credentials")

  const response = await ouraClient.post<OuraPostOAuthTokenResponse>("/oauth/token", {
    grant_type: "refresh_token",
    refresh_token: parsed.data.refresh_token,
    client_id: OURA_CLIENT_ID,
    client_secret: OURA_CLIENT_SECRET,
  })

  const newCreds = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_in: response.data.expires_in,
    token_type: response.data.token_type,
  }
  await updateIntegrationCredentials(integration.id, newCreds)

  return response.data.access_token
}

