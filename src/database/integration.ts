import { sql } from "./connection";

export interface Integration {
  id: string;
  user_id: string;
  provider: string;
  credentials: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export async function getIntegrationsByUserId(
  userId: string
): Promise<Integration[]> {
  return await sql<Integration[]>`
    SELECT * FROM integrations 
    WHERE user_id = ${userId}
  `;
}
