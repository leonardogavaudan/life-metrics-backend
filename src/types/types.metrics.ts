import { z } from "zod";
import { IntegrationProviders } from "./types.provider";

export const Units = {
  Points: "points",
  Count: "count",
} as const;
export const UnitValidator = z.nativeEnum(Units);
export type Unit = z.infer<typeof UnitValidator>;

export const MetricTypes = {
  DailySleepScore: "daily_sleep_score",
  DailySteps: "daily_steps",
} as const;
export const MetricTypeValidator = z.nativeEnum(MetricTypes);
export type MetricType = z.infer<typeof MetricTypeValidator>;

export const Categories = {
  Sleep: "sleep",
  Activity: "activity",
} as const;
export const CategoryValidator = z.nativeEnum(Categories);
export type Category = z.infer<typeof CategoryValidator>;

export const MetricTypeToProviders = {
  [MetricTypes.DailySleepScore]: [IntegrationProviders.Oura],
  [MetricTypes.DailySteps]: [IntegrationProviders.Oura],
} as const;

export const MetricTypeToCategory = {
  [MetricTypes.DailySleepScore]: Categories.Sleep,
  [MetricTypes.DailySteps]: Categories.Activity,
} as const;

export const MetricTypeToDisplayName = {
  [MetricTypes.DailySleepScore]: "Daily Sleep Score",
  [MetricTypes.DailySteps]: "Daily Steps",
} as const;

export const MetricTypeToDefaultPreferredProviders = {
  [MetricTypes.DailySleepScore]: [
    IntegrationProviders.Oura,
    IntegrationProviders.Whoop,
    IntegrationProviders.AppleHealth,
    IntegrationProviders.Fitbit,
    IntegrationProviders.Garmin,
    IntegrationProviders.Coros,
  ],
  [MetricTypes.DailySteps]: [
    IntegrationProviders.Oura,
    IntegrationProviders.Whoop,
    IntegrationProviders.AppleHealth,
    IntegrationProviders.Garmin,
    IntegrationProviders.Fitbit,
    IntegrationProviders.Coros,
  ],
} as const;

export const DailyMetrics = new Set([
  MetricTypes.DailySleepScore,
  MetricTypes.DailySteps,
]);

export const AveragedMetrics = new Set([
  MetricTypes.DailySleepScore,
  MetricTypes.DailySteps,
]);

export const AggregatedMetrics = new Set([]);

export function shouldAverageMetric(metricType: MetricType): boolean {
  return AveragedMetrics.has(metricType);
}
