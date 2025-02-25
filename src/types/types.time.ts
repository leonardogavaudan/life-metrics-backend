import { z } from "zod";

export const TimeRanges = {
  Week: "1_week",
  FourWeeks: "4_week",
  ThreeMonths: "3_month",
  OneYear: "1_year",
  FiveYears: "5_year",
} as const;
export const TimeRangeValidator = z.nativeEnum(TimeRanges);
export type TimeRange = z.infer<typeof TimeRangeValidator>;

export const TimeUnits = {
  Second: "second",
  Minute: "minute",
  Hour: "hour",
  Week: "week",
  Day: "day",
  Month: "month",
  Year: "year",
  Quarter: "quarter",
} as const;

export const AggregationTypes = {
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Yearly: "yearly",
} as const;
export const AggregationTypeValidator = z.nativeEnum(AggregationTypes);
export type AggregationType = z.infer<typeof AggregationTypeValidator>;

export const TimeRangeToAggregationType = {
  [TimeRanges.Week]: AggregationTypes.Daily,
  [TimeRanges.FourWeeks]: AggregationTypes.Daily,
  [TimeRanges.ThreeMonths]: AggregationTypes.Weekly,
  [TimeRanges.OneYear]: AggregationTypes.Monthly,
  [TimeRanges.FiveYears]: AggregationTypes.Quarterly,
} as const;
