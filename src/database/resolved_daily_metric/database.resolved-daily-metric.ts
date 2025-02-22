import { sql } from "../connection";

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
    INSERT INTO resolved_daily_metrics ${sql(payload)}
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
