import { sql } from "../database.connection";
import { handleDatabaseErrors } from "../database.error";

export type SleepSession = {
  id: string;
  user_id: string;
  start_timestamp: string;
  end_timestamp: string;
  created_at: string;
  updated_at: string;
  provider_id: string;
  integration_id: string;
  total_sleep_seconds: number;
};

export const upsertSleepSessions = handleDatabaseErrors(async function upsertSleepSessions(
  sleepSessions: Omit<SleepSession, "id" | "created_at" | "updated_at">[],
): Promise<void> {
  if (sleepSessions.length === 0) {
    return;
  }

  await sql`
        INSERT INTO sleep_sessions
            ${sql(sleepSessions)} ON CONFLICT (provider_id)
      DO
        UPDATE SET
            user_id = EXCLUDED.user_id,
            integration_id = EXCLUDED.integration_id,
            start_timestamp = EXCLUDED.start_timestamp,
            end_timestamp = EXCLUDED.end_timestamp,
            total_sleep_seconds = EXCLUDED.total_sleep_seconds
    `;
});

export type TotalSleepByDate = {
  event_date: string;
  total_sleep_seconds: number;
};

export const getTotalSleepSecondsByDate = handleDatabaseErrors(
  async function getTotalSleepSecondsByDate(
    userId: string,
    integrationId: string,
    startDate: string,
    endDate: string,
  ): Promise<TotalSleepByDate[]> {
    return sql<TotalSleepByDate[]>`
            SELECT
                DATE (end_timestamp) as event_date, CAST (SUM (total_sleep_seconds) AS REAL) as total_sleep_seconds
            FROM sleep_sessions
            WHERE
                user_id = ${userId}
              AND integration_id = ${integrationId}
              AND DATE (end_timestamp) >= ${startDate}
              AND DATE (end_timestamp) <= ${endDate}
            GROUP BY DATE (end_timestamp)
            ORDER BY event_date
        `;
  },
);
