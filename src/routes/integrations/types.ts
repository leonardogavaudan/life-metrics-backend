export enum IntegrationStatus {
  Available = "available",
  Connected = "connected",
  ComingSoon = "coming_soon",
}

export interface ApiIntegration {
  id: string | null;
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
}
