import { IntegrationProvider, IntegrationProviders } from "./types.provider";

export enum IntegrationStatus {
  Available = "available",
  Connected = "connected",
  ComingSoon = "coming_soon",
}
export const IntegrationDetails: Record<
  IntegrationProvider,
  { name: string; description: string; status: IntegrationStatus }
> = {
  [IntegrationProviders.Whoop]: {
    name: "Whoop",
    description:
      "Track your strain, recovery, and sleep with Whoop integration",
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationProviders.Fitbit]: {
    name: "Fitbit",
    description: "Sync your Fitbit data to track steps, sleep, and activity",
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationProviders.Oura]: {
    name: "Oura Ring",
    description: "Import your sleep and recovery data from Oura Ring",
    status: IntegrationStatus.Available,
  },
  [IntegrationProviders.AppleHealth]: {
    name: "Apple Health",
    description:
      "Sync your Apple Health data for comprehensive health tracking",
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationProviders.Garmin]: {
    name: "Garmin",
    description: "Connect your Garmin device to track your fitness activities",
    status: IntegrationStatus.ComingSoon,
  },
  [IntegrationProviders.Coros]: {
    name: "COROS",
    description: "Track your training and performance with COROS integration",
    status: IntegrationStatus.ComingSoon,
  },
};
