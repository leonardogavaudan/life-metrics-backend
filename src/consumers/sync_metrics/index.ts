import { getOuraClient } from "../../authentication/oura.authentication";
import { consumeFromQueue } from "../../messaging";
import { SyncMetricsMessagePayload } from "../../messaging/message";
import { Queue } from "../../messaging/queue";

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
  // const response = await client.get("/usercollection/daily_sleep", {
  //   params: {
  //     start_date: new Date(startTime).toISOString().split("T")[0],
  //     end_date: new Date(endTime).toISOString().split("T")[0],
  //   },
  // });
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
