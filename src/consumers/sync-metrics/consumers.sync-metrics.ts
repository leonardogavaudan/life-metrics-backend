import { upsertIntegrationDailyMetrics } from "../../database/integration-daily-metric/database.integration-daily-metric";
import { getIntegrationByUserIdAndProvider } from "../../database/integration/database.integration";
import { SyncMetricsMessagePayload } from "../../messaging/messaging.message";
import { consumeFromQueue, Queue } from "../../messaging/messaging.queue";
import { IntegrationProviders } from "../../types/types.provider";
import { SyncMetricsStrategyFactory } from "./strategy/consumers.sync-metrics.strategy";

export async function startSyncMetricsConsumer(): Promise<void> {
  console.log("Starting sync metrics consumer...");

  await consumeFromQueue(Queue.SyncMetrics, async (msg) => {
    try {
      console.log("Message:", msg);
      console.log("Message content", msg.content.toString());
      const payload = JSON.parse(
        msg.content.toString(),
      ) as SyncMetricsMessagePayload;
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
  const strategy = factory.getSyncMetricStrategy(IntegrationProviders.Oura);
  const dailyIntegrationMetrics = await strategy.getDailyIntegrationMetrics(
    userId,
    { startTime: new Date(startTime), endTime: new Date(endTime) },
  );
  if (!dailyIntegrationMetrics.length) {
    console.log("No daily integration metrics found");
    return;
  }

  console.log("dailyIntegrationMetrics", dailyIntegrationMetrics);

  await upsertIntegrationDailyMetrics(
    dailyIntegrationMetrics.map((element) => ({
      ...element,
      integration_id: integration.id,
    })),
  );
}

// const startTime = "2025-03-03T15:20:00.130Z";
// const endTime = "2025-03-04T15:25:00.130Z";
// await handleSyncMetricsMessagePayload({
//   userId: "68dd1648-73d9-49ce-8034-1f8887f25a96",
//   provider: "oura",
//   startTime,
//   endTime,
// });
