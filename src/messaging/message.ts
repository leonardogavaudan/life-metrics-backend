import { nanoid } from "nanoid";
import { Queue } from "./queue";

export function createMessage<T>(queue: Queue, payload: T) {
  return {
    id: nanoid(),
    destination: queue,
    payload,
    metadata: {
      type: "task",
      timestamp: new Date().toISOString(),
      retryCount: 0,
    },
  };
}

export type ImportHealthMetricsPayload = {
  integrationId: string;
};
