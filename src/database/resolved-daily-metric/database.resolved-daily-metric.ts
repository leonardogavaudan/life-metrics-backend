import { sql } from "../database.connection";

export type ResolvedDailyMetric = {
  id: string;
  user_id: string;
  event_date: string;
  metric_type: string;
  value: number;
  unit: string;
  integration_priority: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateResolvedDailyMetricPayload = Omit<
  ResolvedDailyMetric,
  "id" | "created_at" | "updated_at"
>;

export async function createResolvedDailyMetric(
  payload: CreateResolvedDailyMetricPayload
): Promise<ResolvedDailyMetric> {
  const [resolvedDailyMetric] = await sql`
    INSERT INTO resolved_daily_metrics (
      user_id,
      event_date,
      metric_type,
      value,
      unit,
      integration_priority
    ) VALUES (
      ${payload.user_id},
      ${payload.event_date}::date,
      ${payload.metric_type},
      ${payload.value},
      ${payload.unit},
      ${payload.integration_priority}
    )
    RETURNING *
  `;
  return resolvedDailyMetric;
}

export async function getResolvedDailyMetricByDateAndUserId(
  userId: string,
  date: Date
): Promise<ResolvedDailyMetric | null> {
  const [resolvedDailyMetric] = await sql`
    SELECT * FROM resolved_daily_metrics
    WHERE user_id = ${userId}
    AND event_date = ${date.toISOString().split("T")[0]}
    LIMIT 1
  `;
  return resolvedDailyMetric || null;
}
