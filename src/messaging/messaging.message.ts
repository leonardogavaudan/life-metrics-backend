import { nanoid } from "nanoid";
import { IntegrationProvider } from "../types/types.provider";
import { Queue } from "./messaging.queue";

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

export function createDelayedMessage<T>(
  queue: Queue,
  payload: T,
  delayMs: number
): Message {
  return {
    properties: {
      id: nanoid(),
      destination: queue,
      type: "task",
      timestamp: new Date().getTime(),
      retryCount: 0,
      maxRetryCount: 5,
      headers: {
        "x-delay": delayMs,
      },
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
    headers?: {
      "x-delay"?: number;
      [key: string]: any;
    };
  };
  content: Buffer;
};

export type SyncMetricsMessagePayload = {
  userId: string;
  provider: IntegrationProvider;
  startTime: string;
  endTime: string;
};

export type HistoricalSyncPayload = {
  userId: string;
  provider: IntegrationProvider;
  startDate: string;
  endDate: string;
  batchSizeInDays?: number;
  delayPerBatchMs?: number;
};
