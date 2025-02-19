import { connect, Connection, ConsumeMessage } from "amqplib";
import { Queue } from "./queue";
import { Message } from "./message";

let connection: Connection | null = null;
let isConnecting = false;

export async function getConnection(): Promise<Connection> {
  if (connection) return connection;

  if (isConnecting) {
    while (isConnecting)
      await new Promise((resolve) => setTimeout(resolve, 100));
    if (!connection)
      throw new Error("Connection not found after isConnected resolved");
    return connection;
  }

  isConnecting = true;
  try {
    connection = await connect(
      `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@rabbitmq`
    );
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
    });
    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      connection = null;
    });
    console.log("RabbitMQ connected");
    return connection;
  } catch (err) {
    console.error("RabbitMQ connection failed:", err);
    connection = null;
    throw err;
  } finally {
    isConnecting = false;
  }
}

export async function sendMessagesToQueue(
  queue: Queue,
  messages: Message[]
): Promise<void> {
  const conn = await getConnection();
  const channel = await conn.createConfirmChannel();
  for (const message of messages) {
    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message.content)),
      message.properties
    );
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
