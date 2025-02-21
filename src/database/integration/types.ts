import { z } from "zod";
import {
  IntegrationProvider,
  IntegrationProviders,
} from "../../types/types.provider";

export const OAuthCredentials = z.object({
  token_type: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.string().datetime(),
  scope: z.optional(z.string()),
});
export type OAuthCredentials = z.infer<typeof OAuthCredentials>;

export const AppleHealthCredentials = OAuthCredentials.extend({
  authorization_key: z.string(),
});
export type AppleHealthCredentials = z.infer<typeof AppleHealthCredentials>;

export type IntegrationCredentials = {
  [key in (typeof IntegrationProviders)[keyof typeof IntegrationProviders]]: key extends typeof IntegrationProviders.AppleHealth
    ? AppleHealthCredentials
    : OAuthCredentials;
};

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  credentials: IntegrationCredentials[IntegrationProvider];
  created_at: string;
  updated_at: string;
  deleted_on: string | null;
}

export type CredentialsForProvider<P extends IntegrationProvider> =
  P extends typeof IntegrationProviders.AppleHealth
    ? AppleHealthCredentials
    : OAuthCredentials;
