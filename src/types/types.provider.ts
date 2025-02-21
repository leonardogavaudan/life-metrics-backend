import { z } from "zod";

export const IntegrationProviders = {
  Whoop: "whoop",
  Fitbit: "fitbit",
  Oura: "oura",
  AppleHealth: "apple_health",
  Garmin: "garmin",
  Coros: "coros",
} as const;
export const IntegrationProvidersValidator = z.nativeEnum(IntegrationProviders);
export type IntegrationProvider = z.infer<typeof IntegrationProvidersValidator>;
