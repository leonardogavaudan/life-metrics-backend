export const INTEGRATIONS = {
  whoop: "whoop",
  fitbit: "fitbit",
  oura: "oura",
  apple_health: "apple_health",
  garmin: "garmin",
  coros: "coros",
} as const;

export type IntegrationProvider = keyof typeof INTEGRATIONS;

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  credentials: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
