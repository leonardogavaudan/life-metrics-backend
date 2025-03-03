import { IntegrationDailyMetric } from "../../../database/integration-daily-metric/database.integration-daily-metric";
import { User } from "../../../database/user/database.user";
import {
  IntegrationProvider,
  IntegrationProviders,
} from "../../../types/types.provider";
import { SyncMetricsStrategyOura } from "./oura/consumers.sync-metrics.strategy.oura";

export interface SyncMetricsStrategy {
  getDailyIntegrationMetrics(
    userId: User["id"],
    { startTime, endTime }: { startTime: Date; endTime: Date },
  ): Promise<
    Omit<
      IntegrationDailyMetric,
      "id" | "integration_id" | "created_at" | "updated_at"
    >[]
  >;
}

export class SyncMetricsStrategyFactory {
  getSyncMetricStrategy(provider: IntegrationProvider): SyncMetricsStrategy {
    switch (provider) {
      case IntegrationProviders.Oura:
        return new SyncMetricsStrategyOura();
      default:
        throw new Error("Provider not supported");
    }
  }
}
