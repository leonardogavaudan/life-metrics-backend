import { z } from "zod";

export const Unit = {
  Points: "points",
} as const;

export const UnitValidator = z.nativeEnum(Unit);
export type Unit = z.infer<typeof UnitValidator>;

export const MetricType = {
  DailySleepScore: "daily_sleep_score",
} as const;

export const MetricTypeValidator = z.nativeEnum(MetricType);
export type MetricType = z.infer<typeof MetricTypeValidator>;
