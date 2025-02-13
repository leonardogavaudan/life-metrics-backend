import { z } from "zod";

export const IntegrationProvider = {
  Whoop: "whoop",
  Fitbit: "fitbit",
  Oura: "oura",
  AppleHealth: "apple_health",
  Garmin: "garmin",
  Coros: "coros",
} as const;
export type IntegrationProvider = typeof IntegrationProvider[keyof typeof IntegrationProvider];

export const OAuthCredentials = z.object({
  token_type: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.string().datetime(),
  scope: z.optional(z.string())
})
export type OAuthCredentials = z.infer<typeof OAuthCredentials>

export const AppleHealthCredentials = OAuthCredentials.extend({
  authorization_key: z.string()
})
export type AppleHealthCredentials = z.infer<typeof AppleHealthCredentials>

export type IntegrationCredentials = {
  [key in typeof IntegrationProvider[keyof typeof IntegrationProvider]]: key extends typeof IntegrationProvider.AppleHealth
  ? AppleHealthCredentials
  : OAuthCredentials;
};

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  credentials: IntegrationCredentials[IntegrationProvider];
  created_at: Date;
  updated_at: Date;
}

