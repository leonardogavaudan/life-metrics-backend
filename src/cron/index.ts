import { schedule } from "node-cron";
import { sendMessagesToQueue } from "../messaging";
import { Queue } from "../messaging/queue";
import { getIntegrations } from "../database/integration";
import { createMessage, SyncMetricsPayload } from "../messaging/message";

export async function setupCronJobs(): Promise<void> {
  schedule("0 * * * *", async () => {
    const integrations = await getIntegrations();
    const messages = integrations.map((integration) => {
      return createMessage<SyncMetricsPayload>(Queue.SyncMetrics, {
        integrationId: integration.id,
      });
    });
    await sendMessagesToQueue(Queue.SyncMetrics, messages);
  });
}
