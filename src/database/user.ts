import { sql } from "./connection";

export interface User {
  id: string;
  email: string;
  google_id: string;
  name: string;
  picture_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export type CreateUser = Omit<
  User,
  "id" | "created_at" | "updated_at" | "picture_url"
> & {
  picture_url?: string;
};

export async function upsertUser(user: CreateUser): Promise<User> {
  const [newUser] = await sql<User[]>`
    INSERT INTO users (
      email,
      google_id,
      name,
      picture_url
    )
    VALUES (
      ${user.email},
      ${user.google_id},
      ${user.name},
      ${user.picture_url || null}
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      google_id = EXCLUDED.google_id,
      name = EXCLUDED.name,
      picture_url = EXCLUDED.picture_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  return newUser;
}
