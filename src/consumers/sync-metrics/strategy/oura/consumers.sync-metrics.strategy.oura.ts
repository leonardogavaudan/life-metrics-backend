import { format, subDays } from "date-fns";
import {
  getDailyActivity,
  getDailySleep,
  getSleepSessions,
} from "../../../../api/oura/api.oura.index";
import { getOuraClient } from "../../../../authentication/oura/authentication.oura";
import { SleepSession } from "../../../../database/sleep-sessions/database.sleep-sessions";
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

    console.log("Daily metrics API call with dates:", {
      startDate: format(startTime, "yyyy-MM-dd"),
      endDate: format(endTime, "yyyy-MM-dd"),
    });

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

  async getSleepSessions(
    userId: User["id"],
    { startTime, endTime }: { startTime: Date; endTime: Date },
  ): Promise<Omit<SleepSession, "id" | "created_at" | "updated_at" | "integration_id">[]> {
    const client = await getOuraClient(userId);

    const adjustedStartTime = subDays(startTime, 1);
    const sleepSessionsResponse = await getSleepSessions(client, adjustedStartTime, endTime);

    // console.log("sleepSessionsResponse", sleepSessionsResponse.data.data);

    return sleepSessionsResponse.data.data
      .filter((session) => session.type !== "deleted") // Skip deleted sessions
      .map((session) => ({
        user_id: userId,
        start_timestamp: session.bedtime_start,
        end_timestamp: session.bedtime_end,
        provider_id: session.id,
      }));
  }
}
