import { startSyncMetricsConsumer } from "./sync-metrics/consumers.sync-metrics";

export async function startConsumers(): Promise<void> {
  console.log("Starting consumers...");
  await startSyncMetricsConsumer();
  console.log("Consumers started successfully");
}
