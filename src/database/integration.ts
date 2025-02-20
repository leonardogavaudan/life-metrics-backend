import { sql } from "bun";
import {
  CredentialsForProvider,
  Integration,
  IntegrationProvider,
} from "./integration/types";

export async function getIntegrations(): Promise<Integration[]> {
  return await sql`
    SELECT * FROM integrations
  `;
}

export async function getIntegrationsByUserId(
  userId: string,
): Promise<Integration[]> {
  return await sql`
    SELECT * FROM integrations
    WHERE user_id = ${userId}
  `;
}

export async function getIntegrationByUserIdAndProvider(
  userId: string,
  provider: IntegrationProvider,
): Promise<Integration | null> {
  const results = await sql`
    SELECT * FROM integrations
    WHERE user_id = ${userId} AND provider = ${provider}
    LIMIT 1
  `;
  return results[0] || null;
}

export async function upsertIntegration(
  userId: string,
  provider: IntegrationProvider,
  credentials: Integration["credentials"],
): Promise<Integration> {
  const [integration] = await sql`
    INSERT INTO integrations (user_id, provider, credentials)
    VALUES (${userId}, ${provider}, ${credentials}::json)
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
      credentials = ${credentials}::json,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return integration;
}

export async function deleteIntegration(
  userId: string,
  provider: IntegrationProvider,
): Promise<void> {
  await sql`
    DELETE FROM integrations
    WHERE user_id = ${userId} AND provider = ${provider}
  `;
}

export async function updateIntegrationCredentials<
  P extends IntegrationProvider,
>(id: string, credentials: CredentialsForProvider<P>): Promise<void> {
  await sql`
     UPDATE integrations
     SET credentials = ${credentials}::json
     WHERE id = ${id}
    `;
}
