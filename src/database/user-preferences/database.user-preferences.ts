import { sql } from "../connection";

export type UserPreferences = {
  id: string;
  user_id: string;
  metric_type: string;
  preferred_integration_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function getUserPreferencesWithIntegrationsByUserId(
  userId: string
): Promise<UserPreferences[]> {
  return await sql`
    SELECT
      user_preferences.*,
      integrations.id as preferred_integration_id
    FROM user_preferences
    LEFT JOIN integrations
      ON integrations.id = user_preferences.preferred_integration_id
    WHERE user_preferences.user_id = ${userId}
    AND integrations.deleted_on IS NULL
    AND user_preferences.deleted_on IS NULL
  `;
}

export async function softDeleteUserPreferenceByUserIdAndMetricType(
  userId: string,
  metricType: string
): Promise<void> {
  await sql`
    UPDATE user_preferences
    SET deleted_on = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
    AND metric_type = ${metricType}
  `;
}
