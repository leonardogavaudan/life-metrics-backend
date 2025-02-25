import axios, { AxiosError, AxiosInstance } from "axios";
import {
  getIntegrationByUserIdAndProvider,
  updateIntegrationCredentials,
} from "../database/integration/database.integration";
import { OAuthCredentials } from "../database/integration/types";
import { IntegrationProviders } from "../types/types.provider";

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID;
if (!OURA_CLIENT_ID) {
  throw new Error("Missing Oura client id");
}
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;
if (!OURA_CLIENT_SECRET) {
  throw new Error("Missing Oura client secret");
}

export async function getOuraClient(userId: string): Promise<AxiosInstance> {
  const ouraClient = axios.create({
    baseURL: "https://api.ouraring.com/v2/",
  });
  const integration = await getIntegrationByUserIdAndProvider(
    userId,
    IntegrationProviders.Oura
  );
  if (!integration) throw new Error("Integration not found");
  const parsed = OAuthCredentials.safeParse(integration.credentials);
  if (!parsed.success) throw new Error("Invalid credentials");
  ouraClient.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${parsed.data.access_token}`;

  ouraClient.interceptors.response.use(undefined, async (error: AxiosError) => {
    if (!error.response) throw error;
    if (error.response.status === 401) {
      const config = error.config;
      if (!config) throw new Error("No config found");
      const newAccessToken = await refreshTokens(userId);
      config.headers.set("Authorization", `Bearer ${newAccessToken}`);
      return ouraClient.request(config);
    }
    throw error;
  });

  return ouraClient;
}

type OuraPostOAuthTokenResponse = {
  token_type: string;
  access_token: string;
  expires_in: number; // Seconds
  refresh_token: string;
};

async function refreshTokens(userId: string): Promise<string> {
  const integration = await getIntegrationByUserIdAndProvider(
    userId,
    IntegrationProviders.Oura
  );
  if (!integration) throw new Error("Integration not found");

  const parsed = OAuthCredentials.safeParse(integration.credentials);
  if (!parsed.success) throw new Error("Invalid credentials");

  const response = await axios.post<OuraPostOAuthTokenResponse>(
    "https://api.ouraring.com/oauth/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: parsed.data.refresh_token,
      client_id: OURA_CLIENT_ID!,
      client_secret: OURA_CLIENT_SECRET!,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const newCreds = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: new Date(
      Date.now() + response.data.expires_in * 1000
    ).toISOString(),
    token_type: response.data.token_type,
  };
  await updateIntegrationCredentials<typeof IntegrationProviders.Oura>(
    integration.id,
    newCreds
  );
  return response.data.access_token;
}
