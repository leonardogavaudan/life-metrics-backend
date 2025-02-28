import { sql } from "../database.connection";
import { handleDatabaseErrors } from "../database.error";

export type TimeSeriesMetric = {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  unit: string;
  event_timestamp: string;
  integration_id: string | null;
  sleep_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_on: string | null;
};

export type CreateTimeSeriesMetricPayload = Omit<
  TimeSeriesMetric,
  "id" | "created_at" | "updated_at"
>;

export const createTimeSeriesMetric = handleDatabaseErrors(
  async function createTimeSeriesMetric(
    payload: CreateTimeSeriesMetricPayload,
  ): Promise<TimeSeriesMetric> {
    const [timeSeriesMetric] = await sql`
      INSERT INTO time_series_metrics (
        user_id,
        metric_type,
        value,
        unit,
        event_timestamp,
        integration_id,
        sleep_id
      ) VALUES (
        ${payload.user_id},
        ${payload.metric_type},
        ${payload.value},
        ${payload.unit},
        ${payload.event_timestamp}::timestamptz,
        ${payload.integration_id},
        ${payload.sleep_id}
      )
      RETURNING *
    `;
    return timeSeriesMetric;
  },
);

export const getTimeSeriesMetricsByUserIdAndTimeRange = handleDatabaseErrors(
  async function getTimeSeriesMetricsByUserIdAndTimeRange(
    userId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<TimeSeriesMetric[]> {
    const timeSeriesMetrics = await sql`
      SELECT * FROM time_series_metrics
      WHERE user_id = ${userId}
      AND event_timestamp >= ${startTime.toISOString()}
      AND event_timestamp <= ${endTime.toISOString()}
      AND deleted_on IS NULL
      ORDER BY event_timestamp ASC
    `;
    return timeSeriesMetrics;
  },
);

export const getTimeSeriesMetricsByUserIdAndMetricType = handleDatabaseErrors(
  async function getTimeSeriesMetricsByUserIdAndMetricType(
    userId: string,
    metricType: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<TimeSeriesMetric[]> {
    const timeSeriesMetrics = await sql`
    SELECT * FROM time_series_metrics
    WHERE user_id = ${userId}
    AND metric_type = ${metricType}
    AND deleted_on IS NULL
    ${
      startTime ? sql`AND event_timestamp >= ${startTime.toISOString()}` : sql``
    }
    ${endTime ? sql`AND event_timestamp <= ${endTime.toISOString()}` : sql``}
    ORDER BY event_timestamp ASC
  `;
    return timeSeriesMetrics;
  },
);

export const deleteTimeSeriesMetric = handleDatabaseErrors(
  async function deleteTimeSeriesMetric(
    id: string,
  ): Promise<TimeSeriesMetric | null> {
    const [deletedMetric] = await sql`
      UPDATE time_series_metrics
      SET deleted_on = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return deletedMetric || null;
  },
);

export const getTimeSeriesMetricsByUserId = handleDatabaseErrors(
  async function getTimeSeriesMetricsByUserId(
    userId: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<TimeSeriesMetric[]> {
    const timeSeriesMetrics = await sql`
      SELECT * FROM time_series_metrics
      WHERE user_id = ${userId}
      ${
        startTime
          ? sql`AND event_timestamp >= ${startTime.toISOString()}`
          : sql``
      }
      ${endTime ? sql`AND event_timestamp <= ${endTime.toISOString()}` : sql``}
      AND deleted_on IS NULL
      ORDER BY event_timestamp ASC
    `;
    return timeSeriesMetrics;
  },
);
