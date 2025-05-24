import { addDays, format, startOfDay, toDate } from "date-fns";
import { upsertIntegrationDailyMetrics } from "../../database/integration-daily-metric/database.integration-daily-metric";
import { getIntegrationByUserIdAndProvider } from "../../database/integration/database.integration";
import { upsertSleepSessions } from "../../database/sleep-sessions/database.sleep-sessions";
import { SyncMetricsMessagePayload } from "../../messaging/messaging.message";
import { consumeFromQueue, Queue } from "../../messaging/messaging.queue";
import { SyncMetricsStrategyFactory } from "./strategy/consumers.sync-metrics.strategy";

export async function startSyncMetricsConsumer(): Promise<void> {
  console.log("Starting sync metrics consumer...");

  await consumeFromQueue(Queue.SyncMetrics, async (msg) => {
    try {
      console.log("Message:", msg);
      console.log("Message content", msg.content.toString());
      const payload = JSON.parse(msg.content.toString()) as SyncMetricsMessagePayload;
      await handleSyncMetricsMessagePayload(payload);
    } catch (error) {
      console.error("Error parsing/handling sync metrics message:", error);
      throw error;
    }
  });

  console.log("Sync metrics consumer started successfully");
}

async function handleSyncMetricsMessagePayload({
  userId,
  provider,
  startTime,
  endTime,
}: SyncMetricsMessagePayload): Promise<void> {
  console.log(
    `Starting sync for user ${userId} for the provider ${provider} from ${startTime} to ${endTime}`,
  );

  const integration = await getIntegrationByUserIdAndProvider(userId, provider);
  if (!integration) throw new Error("Integration not found");

  const factory = new SyncMetricsStrategyFactory();
  const strategy = factory.getSyncMetricStrategy(provider);

  const isSameDay =
    format(toDate(startTime), "yyyy-MM-dd") == format(toDate(endTime), "yyyy-MM-dd");

  const timeRange = {
    startTime: startOfDay(toDate(startTime)),
    endTime: isSameDay ? startOfDay(addDays(toDate(endTime), 1)) : startOfDay(toDate(endTime)),
  };

  console.log("Adjusted timeRange for API calls:", timeRange);
  console.log("Date range for API calls:", {
    startDate: format(timeRange.startTime, "yyyy-MM-dd"),
    endDate: format(timeRange.endTime, "yyyy-MM-dd"),
  });
  // Sync daily integration metrics
  const dailyIntegrationMetrics = await strategy.getDailyIntegrationMetrics(userId, timeRange);
  if (dailyIntegrationMetrics.length) {
    console.log("dailyIntegrationMetrics", dailyIntegrationMetrics);

    await upsertIntegrationDailyMetrics(
      dailyIntegrationMetrics.map((element) => ({
        ...element,
        integration_id: integration.id,
      })),
    );
  } else {
    console.log("No daily integration metrics found");
  }

  // Sync sleep sessions
  const sleepSessions = await strategy.getSleepSessions(userId, timeRange);
  if (sleepSessions.length) {
    console.log("sleepSessions", sleepSessions);
    await upsertSleepSessions(
      sleepSessions.map((element) => ({ ...element, integration_id: integration.id })),
    );
  } else {
    console.log("No sleep sessions found");
  }
}

// const startTime = "2025-05-24T10:00:00.000Z";
// const endTime = "2025-05-24T10:15:00.000Z";
// await handleSyncMetricsMessagePayload({
//   userId: "68dd1648-73d9-49ce-8034-1f8887f25a96",
//   provider: "oura",
//   startTime,
//   endTime,
// });
