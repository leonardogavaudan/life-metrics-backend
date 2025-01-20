import { sql } from "./connection";
import { Integration } from "./integration/types";

export async function getIntegrationsByUserId(
  userId: string
): Promise<Integration[]> {
  return await sql<Integration[]>`
    SELECT * FROM integrations 
    WHERE user_id = ${userId}
  `;
}

export * from "./integration/types";
