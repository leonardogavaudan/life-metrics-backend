import { nanoid } from "nanoid";
import { Queue } from "./queue";
import { IntegrationProvider } from "../types/types.provider";

export function createMessage<T>(queue: Queue, payload: T): Message {
  return {
    properties: {
      id: nanoid(),
      destination: queue,
      type: "task",
      timestamp: new Date().getTime(),
      retryCount: 0,
      maxRetryCount: 5,
    },
    content: Buffer.from(JSON.stringify(payload)),
  };
}

export type Message = {
  properties: {
    id: string;
    destination: string;
    type: "task" | "event";
    timestamp: number;
    retryCount: number;
    maxRetryCount: number;
  };
  content: Buffer;
};

export type SyncMetricsMessagePayload = {
  userId: string;
  provider: IntegrationProvider;
  startTime: string;
  endTime: string;
};
