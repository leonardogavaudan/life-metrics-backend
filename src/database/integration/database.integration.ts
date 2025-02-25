import { sql } from "../connection";
import { CredentialsForProvider, Integration } from "./types";
import { IntegrationProvider } from "../../types/types.provider";

export async function getIntegrations(): Promise<Integration[]> {
  return await sql`
    SELECT * FROM integrations
    WHERE deleted_on IS NULL
  `;
}

export async function getIntegrationsByUserId(
  userId: string
): Promise<Integration[]> {
  return await sql`
    SELECT * FROM integrations
    WHERE user_id = ${userId}
    AND deleted_on IS NULL
  `;
}

export async function getIntegrationByUserIdAndProvider(
  userId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const results = await sql`
    SELECT * FROM integrations
    WHERE user_id = ${userId} AND provider = ${provider}
    AND deleted_on IS NULL
    LIMIT 1
  `;
  return results[0] || null;
}

export async function upsertIntegration(
  userId: string,
  provider: IntegrationProvider,
  credentials: Integration["credentials"]
): Promise<Integration> {
  const [integration] = await sql`
    INSERT INTO integrations (user_id, provider, credentials)
    VALUES (${userId}, ${provider}, ${credentials}::json)
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
      credentials = ${credentials}::json,
      updated_at = CURRENT_TIMESTAMP,
      deleted_on = NULL 
    RETURNING *
  `;
  return integration;
}

export async function updateIntegrationCredentials<
  P extends IntegrationProvider
>(id: string, credentials: CredentialsForProvider<P>): Promise<void> {
  await sql`
    UPDATE integrations
    SET credentials = ${credentials}::json
    WHERE id = ${id}
  `;
}

export async function softDeleteIntegrationById(id: string): Promise<void> {
  await sql`
    UPDATE integrations
    SET deleted_on = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}
