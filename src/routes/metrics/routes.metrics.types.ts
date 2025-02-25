import { MetricType } from "../../types/types.metrics";
import { AggregationType, TimeRange } from "../../types/types.time";

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface GetDashboardMetricResponse {
  data: MetricDataPoint[];
  metadata: {
    metricType: MetricType;
    timeRange: TimeRange;
    aggregation: AggregationType;
    unit: string;
    summary?: {
      average?: number;
      trend?: number;
      changePercentage?: number;
    };
  } | null;
}
