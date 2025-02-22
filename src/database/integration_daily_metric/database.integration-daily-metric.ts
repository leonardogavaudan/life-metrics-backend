import { sql } from "../connection";

export type IntegrationDailyMetric = {
  id: string;
  resolved_daily_metric_id: string;
  integration_id: string;
  metric_type: string;
  value: number;
  unit: string;
  event_date: string;
  created_at: string;
  updated_at: string;
};

export type CreateIntegrationDailyMetricPayload = Omit<
  IntegrationDailyMetric,
  "id" | "created_at" | "updated_at"
>;

export async function createIntegrationDailyMetric(
  payload: CreateIntegrationDailyMetricPayload
): Promise<IntegrationDailyMetric> {
  const [metric] = await sql`
    INSERT INTO integration_daily_metrics (
      resolved_daily_metric_id,
      integration_id,
      metric_type,
      value,
      unit,
      event_date
    ) VALUES (
      ${payload.resolved_daily_metric_id},
      ${payload.integration_id},
      ${payload.metric_type},
      ${payload.value},
      ${payload.unit},
      ${payload.event_date}::date
    )
    RETURNING *
  `;
  return metric;
}

export async function upsertIntegrationDailyMetric(
  payload: CreateIntegrationDailyMetricPayload
): Promise<IntegrationDailyMetric> {
  const [metric] = await sql`
    INSERT INTO integration_daily_metrics (
      resolved_daily_metric_id,
      integration_id,
      metric_type,
      value,
      unit,
      event_date
    ) VALUES (
      ${payload.resolved_daily_metric_id},
      ${payload.integration_id},
      ${payload.metric_type},
      ${payload.value},
      ${payload.unit},
      ${payload.event_date}::date
    )
    ON CONFLICT (integration_id, metric_type, event_date)
    DO UPDATE SET
      value = EXCLUDED.value,
      unit = EXCLUDED.unit
    RETURNING *
  `;
  return metric;
}
