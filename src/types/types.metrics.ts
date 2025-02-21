import { z } from "zod";
import { IntegrationProviders } from "./types.provider";

export const Units = {
  Points: "points",
} as const;
export const UnitValidator = z.nativeEnum(Units);
export type Unit = z.infer<typeof UnitValidator>;

export const MetricTypes = {
  DailySleepScore: "daily_sleep_score",
} as const;
export const MetricTypeValidator = z.nativeEnum(MetricTypes);
export type MetricType = z.infer<typeof MetricTypeValidator>;

export const Categories = {
  Sleep: "sleep",
} as const;
export const CategoryValidator = z.nativeEnum(Categories);
export type Category = z.infer<typeof CategoryValidator>;

export const MetricTypeToProviders = {
  [MetricTypes.DailySleepScore]: [IntegrationProviders.Oura],
} as const;

export const MetricTypeToCategory = {
  [MetricTypes.DailySleepScore]: Categories.Sleep,
} as const;

export const MetricTypeToDisplayName = {
  [MetricTypes.DailySleepScore]: "Daily Sleep Score",
} as const;
