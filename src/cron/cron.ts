import { schedule } from "node-cron";
import { sendMessagesToQueue } from "../messaging/messaging.queue";
import { Queue } from "../messaging/messaging.queue";
import { getIntegrations } from "../database/integration/database.integration";
import {
  createMessage,
  SyncMetricsMessagePayload,
} from "../messaging/messaging.message";

export function setupCronJobs(): void {
  schedule("*/15 * * * *", async () => {
    const integrations = await getIntegrations();
    const messages = integrations.map((integration) => {
      return createMessage<SyncMetricsMessagePayload>(Queue.SyncMetrics, {
        userId: integration.user_id,
        provider: integration.provider,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    });
    await sendMessagesToQueue(Queue.SyncMetrics, messages);
  });
}
