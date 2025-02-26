import { connect, Connection } from "amqplib";

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
