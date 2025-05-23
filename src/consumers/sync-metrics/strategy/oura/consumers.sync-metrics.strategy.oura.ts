import { format } from "date-fns";
import { getDailyActivity, getDailySleep } from "../../../../api/oura/api.oura.index";
import { getOuraClient } from "../../../../authentication/oura/authentication.oura";
import { User } from "../../../../database/user/database.user";
import { MetricTypes, Units } from "../../../../types/types.metrics";
import { SyncMetricsStrategy } from "../consumers.sync-metrics.strategy";

export class SyncMetricsStrategyOura implements SyncMetricsStrategy {
  async getDailyIntegrationMetrics(
    userId: User["id"],
    { startTime, endTime }: { startTime: Date; endTime: Date },
  ) {
    const client = await getOuraClient(userId);
    const dailyIntegrationMetrics = [];

    const dailySleepResponse = await getDailySleep(client, startTime, endTime);
    const dailySleepScoreMetrics = dailySleepResponse.data.data.map(
      (
        ouraMetric,
      ): Awaited<ReturnType<SyncMetricsStrategy["getDailyIntegrationMetrics"]>>[number] => {
        return {
          metric_type: MetricTypes.DailySleepScore,
          value: ouraMetric.score,
          unit: Units.Points,
          event_date: format(new Date(ouraMetric.day), "yyyy-MM-dd"),
        };
      },
    );
    dailyIntegrationMetrics.push(...dailySleepScoreMetrics);

    const activityResponse = await getDailyActivity(client, startTime, endTime);
    for (const activity of activityResponse.data.data) {
      dailyIntegrationMetrics.push({
        metric_type: MetricTypes.DailySteps,
        value: activity.steps,
        unit: Units.Count,
        event_date: format(new Date(activity.day), "yyyy-MM-dd"),
      });

      dailyIntegrationMetrics.push({
        metric_type: MetricTypes.DailyTotalCalories,
        value: activity.total_calories,
        unit: Units.Count,
        event_date: format(new Date(activity.day), "yyyy-MM-dd"),
      });
    }

    return dailyIntegrationMetrics;
  }
}
