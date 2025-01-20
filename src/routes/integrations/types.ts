export enum IntegrationStatus {
  Available = "available",
  Connected = "connected",
}

export interface ApiIntegration {
  id: string | null;
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
}
