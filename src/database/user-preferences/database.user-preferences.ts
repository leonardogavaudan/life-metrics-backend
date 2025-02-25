import { IntegrationProvider } from "../../types/types.provider";
import { sql } from "../connection";

export type UserPreferences = {
  id: string;
  user_id: string;
  metric_type: string;
  preferred_integration_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_on: Date | null;
};

export async function getUserPreferencesWithIntegrationsByUserId(
  userId: string
): Promise<
  (UserPreferences & {
    preferred_integration_id: string | null;
    preferred_integration_provider: IntegrationProvider | null;
  })[]
> {
  return await sql`
    SELECT
      user_preferences.*,
      integrations.id as preferred_integration_id,
      integrations.provider as preferred_integration_provider
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

export type UpsertUserPreferencesPayload = Pick<
  UserPreferences,
  "preferred_integration_id"
>;

export async function upsertUserPreferenceByUserIdAndMetricType(
  userId: string,
  metricType: string,
  payload: UpsertUserPreferencesPayload
): Promise<void> {
  await sql`
    INSERT INTO user_preferences (user_id, metric_type, preferred_integration_id)
    VALUES (${userId}, ${metricType}, ${payload.preferred_integration_id})
    ON CONFLICT (user_id, metric_type)
    DO UPDATE SET
      preferred_integration_id = EXCLUDED.preferred_integration_id,
      updated_at = CURRENT_TIMESTAMP,
      deleted_on = NULL
    WHERE user_preferences.deleted_on IS NULL
  `;
}
