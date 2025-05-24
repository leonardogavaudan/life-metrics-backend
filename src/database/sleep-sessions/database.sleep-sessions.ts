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
};

export const upsertSleepSessions = handleDatabaseErrors(async function upsertSleepSessions(
  sleepSessions: Omit<SleepSession, "id" | "created_at" | "updated_at">[],
): Promise<void> {
  if (sleepSessions.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  await sql`
        INSERT INTO sleep_sessions
            ${sql(sleepSessions)} ON CONFLICT (provider_id)
      DO
        UPDATE SET
            user_id = EXCLUDED.user_id,
            integration_id = EXCLUDED.integration_id,
            start_timestamp = EXCLUDED.start_timestamp,
            end_timestamp = EXCLUDED.end_timestamp
    `;
});
