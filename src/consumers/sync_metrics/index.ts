import { getDailySleep } from "../../api/oura";
import { getOuraClient } from "../../authentication/oura.authentication";
import {
  createIntegrationDailyMetric,
  upsertIntegrationDailyMetric,
} from "../../database/integration_daily_metric/database.integration-daily-metric";
import {
  createResolvedDailyMetric,
  getResolvedDailyMetricByDateAndUserId,
  ResolvedDailyMetric,
} from "../../database/resolved_daily_metric/database.resolved-daily-metric";
import { consumeFromQueue } from "../../messaging";
import { SyncMetricsMessagePayload } from "../../messaging/message";
import { Queue } from "../../messaging/queue";
import { MetricTypes, Units } from "../../types/types.metrics";

async function handleSyncMetricsMessagePayload({
  userId,
  provider,
  startTime,
  endTime,
}: SyncMetricsMessagePayload): Promise<void> {
  console.log(
    `Starting sync for user ${userId} for the provider ${provider} from ${startTime} to ${endTime}`
  );

  const client = await getOuraClient(userId);
  const response = await getDailySleep(
    client,
    new Date(startTime),
    new Date(endTime)
  );
  const { day, score } = response.data.data;

  const resolvedDailyMetric = await upsertResolvedDailyMetric(
    userId,
    day,
    score
  );

  await upsertIntegrationDailyMetric({
    resolved_daily_metric_id: resolvedDailyMetric.id,
    integration_id: userId,
    metric_type: MetricTypes.DailySleepScore,
    value: score,
    unit: Units.Points,
    event_date: day,
  });
}

async function upsertResolvedDailyMetric(
  userId: string,
  day: string,
  score: number
): Promise<ResolvedDailyMetric> {
  console.log(`Upserting resolved daily metric for user ${userId} on ${day}`);
  console.log(new Date(day).toISOString());
  const resolvedDailyMetric = await getResolvedDailyMetricByDateAndUserId(
    userId,
    new Date(day)
  );
  if (resolvedDailyMetric) {
    return resolvedDailyMetric;
  }

  return await createResolvedDailyMetric({
    user_id: userId,
    event_date: day,
    metric_type: MetricTypes.DailySleepScore,
    value: score,
    unit: Units.Points,
    integration_priority: {},
  });
}

export async function startSyncMetricsConsumer(): Promise<void> {
  console.log("Starting sync metrics consumer...");

  await consumeFromQueue(Queue.SyncMetrics, async (msg) => {
    try {
      console.log("Message:", msg);
      console.log("Message content", msg.content.toString());
      const payload = JSON.parse(
        msg.content.toString()
      ) as SyncMetricsMessagePayload;
      await handleSyncMetricsMessagePayload(payload);
    } catch (error) {
      console.error("Error parsing/handling sync metrics message:", error);
      throw error;
    }
  });

  console.log("Sync metrics consumer started successfully");
}

// const client = await getOuraClient("68dd1648-73d9-49ce-8034-1f8887f25a96");
// const response = await client.get("/usercollection/daily_sleep", {
//   params: {
//     start_date: new Date("2025-02-20T15:20:00.130Z")
//       .toISOString()
//       .split("T")[0],
//     end_date: new Date("2025-02-20T15:25:00.130Z").toISOString().split("T")[0],
//   },
// });

// console.log(response.data);
// console.log(response.data.data);
