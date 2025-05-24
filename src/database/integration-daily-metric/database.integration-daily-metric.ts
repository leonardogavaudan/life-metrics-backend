import { MetricType } from "../../types/types.metrics";
import { sql } from "../database.connection";
import { Integration } from "../integration/database.integration.types";
import { format } from "date-fns";
import { handleDatabaseErrors } from "../database.error";

export type IntegrationDailyMetric = {
  id: string;
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
export const createIntegrationDailyMetric = handleDatabaseErrors(
  async function createIntegrationDailyMetric(
    payload: CreateIntegrationDailyMetricPayload,
  ): Promise<IntegrationDailyMetric> {
    const [metric] = await sql`
            INSERT INTO integration_daily_metrics (integration_id,
                                                   metric_type,
                                                   value,
                                                   unit,
                                                   event_date)
            VALUES (${payload.integration_id},
                    ${payload.metric_type},
                    ${payload.value},
                    ${payload.unit},
                    ${payload.event_date}::date) RETURNING *
        `;
    return metric;
  },
);

export const upsertIntegrationDailyMetrics = handleDatabaseErrors(
  async function upsertIntegrationDailyMetrics(
    payloads: CreateIntegrationDailyMetricPayload[],
  ): Promise<IntegrationDailyMetric[]> {
    if (!payloads.length) return [];

    return sql`
            INSERT INTO integration_daily_metrics
                ${sql(payloads)} ON CONFLICT (integration_id, metric_type, event_date)
            DO
            UPDATE SET
                value = EXCLUDED.value,
                unit = EXCLUDED.unit
                RETURNING *
        `;
  },
);

export const getIntegrationDailyMetricsByMetricTypeAndIntegrationIdAndTimeRange =
  handleDatabaseErrors(
    async function getIntegrationDailyMetricsByMetricTypeAndIntegrationIdAndTimeRange(
      metricType: MetricType,
      integrationId: Integration["id"],
      { startDate, endDate }: { startDate: Date; endDate: Date },
    ): Promise<IntegrationDailyMetric[]> {
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      return sql`
                SELECT *
                from integration_daily_metrics
                WHERE metric_type = ${metricType}
                  AND integration_id = ${integrationId}
                  AND event_date >= ${formattedStartDate}::date
                  AND event_date <= ${formattedEndDate}:: date
            `;
    },
  );
