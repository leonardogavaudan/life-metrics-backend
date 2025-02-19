import { schedule } from "node-cron";
import { sendMessagesToQueue } from "../messaging";
import { Queue } from "../messaging/queue";
import { getIntegrations } from "../database/integration";
import { createMessage, SyncMetricsMessagePayload } from "../messaging/message";

export function setupCronJobs(): void {
  schedule("0 * * * *", async () => {
    const integrations = await getIntegrations();
    const messages = integrations.map((integration) => {
      return createMessage<SyncMetricsMessagePayload>(Queue.SyncMetrics, {
        integrationId: integration.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    });
    await sendMessagesToQueue(Queue.SyncMetrics, messages);
  });
}
