import { sql } from "./connection";
import { Integration, IntegrationProvider } from "./integration/types";

export async function getIntegrationsByUserId(
  userId: string
): Promise<Integration[]> {
  return await sql<Integration[]>`
    SELECT * FROM integrations 
    WHERE user_id = ${userId}
  `;
}

export async function getIntegrationByUserIdAndProvider(
  userId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const results = await sql<Integration[]>`
    SELECT * FROM integrations
    WHERE user_id = ${userId} AND provider = ${provider}
    LIMIT 1
  `;
  return results[0] || null;
}

export async function upsertIntegration(
  userId: string,
  provider: IntegrationProvider,
  credentials: Record<string, unknown>
): Promise<Integration> {
  const [integration] = await sql<Integration[]>`
    INSERT INTO integrations (user_id, provider, credentials)
    VALUES (${userId}, ${provider}, ${JSON.stringify(credentials)})
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
      credentials = ${JSON.stringify(credentials)},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return integration;
}

export async function deleteIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<void> {
  await sql`
    DELETE FROM integrations
    WHERE user_id = ${userId} AND provider = ${provider}
  `;
}

export * from "./integration/types";
