import {
  IntegrationProviders,
  IntegrationProvider,
} from "../../database/integration/types";

export enum IntegrationStatus {
  Available = "available",
  Connected = "connected",
  ComingSoon = "coming_soon",
}

export interface ApiIntegration {
  id: string | null;
  provider: IntegrationProvider;
  name: string;
  description: string;
  status: IntegrationStatus;
}

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  redirectPath: string;
}

export interface OAuthState {
  provider: IntegrationProvider;
  userId: string;
  timestamp: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export const OAUTH_CONFIGS: Partial<Record<IntegrationProvider, OAuthConfig>> =
  {
    [IntegrationProviders.Oura]: {
      authUrl: "https://cloud.ouraring.com/oauth/authorize",
      tokenUrl: "https://api.ouraring.com/oauth/token",
      clientId: process.env.OURA_CLIENT_ID!,
      clientSecret: process.env.OURA_CLIENT_SECRET!,
      scope: ["daily", "heartrate", "personal", "workout"],
      redirectPath: "/integrations/oauth/callback",
    },
  };
