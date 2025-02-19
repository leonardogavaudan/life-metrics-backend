import { consumeFromQueue } from "../../messaging";
import { SyncMetricsMessagePayload } from "../../messaging/message";
import { Queue } from "../../messaging/queue";

async function handleSyncMetricsMessagePayload({
  integrationId,
  startTime,
  endTime,
}: SyncMetricsMessagePayload): Promise<void> {
  console.log(
    `Starting sync for integration ${integrationId} from ${startTime} to ${endTime}`
  );
}

export async function startSyncMetricsConsumer(): Promise<void> {
  console.log("Starting sync metrics consumer...");

  await consumeFromQueue(Queue.SyncMetrics, async (msg) => {
    try {
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
