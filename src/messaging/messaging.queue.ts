import { ConsumeMessage } from "amqplib";
import { getConnection } from "./messaging.connection";
import { Message } from "./messaging.message";

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

export async function publishDelayedMessagesToExchange(
  exchange: Exchange,
  routingKey: Queue,
  messages: Message[]
): Promise<void> {
  console.log(
    `Publishing ${messages.length} delayed messages to exchange ${exchange} with routing key ${routingKey}`
  );
  const conn = await getConnection();
  const channel = await conn.createConfirmChannel();

  for (const message of messages) {
    channel.publish(exchange, routingKey, message.content, message.properties);
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

export enum Exchange {
  DelayedSyncMetrics = "delayed_sync_metrics",
}
