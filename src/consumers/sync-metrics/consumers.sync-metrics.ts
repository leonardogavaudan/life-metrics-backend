import { getDailySleep } from "../../api/oura/api.oura.index";
import { getOuraClient } from "../../authentication/oura/authentication.oura";
import { upsertIntegrationDailyMetric } from "../../database/integration-daily-metric/database.integration-daily-metric";
import { getIntegrationByUserIdAndProvider } from "../../database/integration/database.integration";
import {
  createResolvedDailyMetric,
  getResolvedDailyMetricByDateAndUserId,
  ResolvedDailyMetric,
} from "../../database/resolved-daily-metric/database.resolved-daily-metric";
import { SyncMetricsMessagePayload } from "../../messaging/messaging.message";
import { consumeFromQueue, Queue } from "../../messaging/messaging.queue";
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
  console.log("response.data", response.data);
  if (!response.data.data.length) {
    console.log("No data returned from Oura");
    return;
  }

  const { day, score } = response.data.data[0];

  const resolvedDailyMetric = await upsertResolvedDailyMetric(
    userId,
    day,
    score
  );

  const integration = await getIntegrationByUserIdAndProvider(userId, provider);
  if (!integration) throw new Error("Integration not found");

  await upsertIntegrationDailyMetric({
    resolved_daily_metric_id: resolvedDailyMetric.id,
    integration_id: integration.id,
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
  const resolvedDailyMetric = await getResolvedDailyMetricByDateAndUserId(
    userId,
    new Date(day)
  );
  if (resolvedDailyMetric) {
    return resolvedDailyMetric;
  }

  return await createResolvedDailyMetric({
    user_id: userId,
    event_date: new Date(day).toISOString().split("T")[0],
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

// const startTime = "2025-02-21T15:20:00.130Z";
// const endTime = "2025-02-21T15:25:00.130Z";
// await handleSyncMetricsMessagePayload({
//   userId: "68dd1648-73d9-49ce-8034-1f8887f25a96",
//   provider: "oura",
//   startTime,
//   endTime,
// });
