import { ConsumeMessage } from "amqplib";
import { Message } from "./messaging.message";
import { getConnection } from "./messaging.connection";

export async function sendMessagesToQueue(
  queue: Queue,
  messages: Message[]
): Promise<void> {
  console.log(`Sending ${messages.length} messages to queue ${queue}`);
  const conn = await getConnection();
  const channel = await conn.createConfirmChannel();
  for (const message of messages) {
    channel.sendToQueue(queue, message.content, message.properties);
  }
  await channel.waitForConfirms();
  await channel.close();
}

export type MessageHandler = (msg: ConsumeMessage) => Promise<void>;

export async function consumeFromQueue(
  queue: Queue,
  handler: MessageHandler
): Promise<void> {
  const conn = await getConnection();
  const channel = await conn.createChannel();

  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      await handler(msg);
      channel.ack(msg);
    } catch (error) {
      console.error(`Error processing message from queue ${queue}:`, error);
      channel.nack(msg);
    }
  });

  channel.on("close", () => {
    console.log(`Channel for queue ${queue} closed`);
  });

  channel.on("error", (err) => {
    console.error(`Channel error for queue ${queue}:`, err);
  });
}
export enum Queue {
  SyncMetrics = "sync_metrics",
}
