import { addDays, differenceInDays, parseISO } from "date-fns";
import {
  createDelayedMessage,
  HistoricalSyncPayload,
  SyncMetricsMessagePayload,
} from "../../messaging/messaging.message";
import {
  Exchange,
  publishDelayedMessagesToExchange,
  Queue,
} from "../../messaging/messaging.queue";

const DEFAULT_DELAY_PER_BATCH_MS = 5 * 60 * 1000;

export async function scheduleHistoricalSync({
  userId,
  provider,
  startDate,
  endDate,
  batchSizeInDays = 7,
  delayPerBatchMs = DEFAULT_DELAY_PER_BATCH_MS,
}: HistoricalSyncPayload): Promise<void> {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const totalDays = differenceInDays(end, start) + 1;

  const batchCount = Math.ceil(totalDays / batchSizeInDays);

  console.log(
    `Scheduling historical sync for user ${userId} from ${startDate} to ${endDate}`,
  );
  console.log(
    `Total days: ${totalDays}, batch size: ${batchSizeInDays} days, batch count: ${batchCount}, delay per batch: ${delayPerBatchMs}ms`,
  );

  const messages = [];

  for (let i = 0; i < batchCount; i++) {
    const batchEndDate = i === 0 ? end : addDays(end, -i * batchSizeInDays);

    const batchStartDate =
      i === batchCount - 1
        ? start
        : addDays(batchEndDate, -batchSizeInDays + 1);

    const initialDelayMs = 10000;
    const delayMs = initialDelayMs + i * delayPerBatchMs;

    const payload: SyncMetricsMessagePayload = {
      userId,
      provider,
      startTime: batchStartDate.toISOString(),
      endTime: batchEndDate.toISOString(),
    };

    const message = createDelayedMessage(Queue.SyncMetrics, payload, delayMs);
    messages.push(message);
  }

  console.log("messages", messages);

  await publishDelayedMessagesToExchange(
    Exchange.DelayedSyncMetrics,
    Queue.SyncMetrics,
    messages,
  );

  console.log(`Scheduled ${messages.length} batches for historical sync`);
}
