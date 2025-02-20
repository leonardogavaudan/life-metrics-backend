import { sql } from "bun";

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

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await sql`
    SELECT * FROM users WHERE id = ${id}
  `;

  return user || null;
}

export async function upsertUser(user: CreateUser): Promise<User> {
  const [newUser] = await sql`
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

export async function deleteUserById(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM users
    WHERE id = ${id}
    RETURNING id
  `;

  return result.length > 0;
}
