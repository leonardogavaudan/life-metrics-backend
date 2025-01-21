export const INTEGRATIONS = {
  whoop: "whoop",
  fitbit: "fitbit",
  oura: "oura",
  apple_health: "apple_health",
  garmin: "garmin",
  coros: "coros",
} as const;

export type IntegrationProvider = keyof typeof INTEGRATIONS;

export interface OAuthCredentials {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface AppleHealthCredentials {
  // Apple Health specific credentials if needed
  // This is a placeholder since Apple Health might use a different auth mechanism
  authorization_key: string;
}

export type IntegrationCredentials = {
  [INTEGRATIONS.whoop]: OAuthCredentials;
  [INTEGRATIONS.fitbit]: OAuthCredentials;
  [INTEGRATIONS.oura]: OAuthCredentials;
  [INTEGRATIONS.garmin]: OAuthCredentials;
  [INTEGRATIONS.coros]: OAuthCredentials;
  [INTEGRATIONS.apple_health]: AppleHealthCredentials;
};

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  credentials: IntegrationCredentials[IntegrationProvider];
  created_at: Date;
  updated_at: Date;
}
