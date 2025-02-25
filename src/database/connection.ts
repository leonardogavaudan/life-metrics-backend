import { SQL } from "bun";

if (
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD ||
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_DB
) {
  throw new Error("Missing required environment variables");
}

let sqlInstance: SQL | null = null;

function createConnection(): SQL {
  const connectionUrl = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DB}`;
  // @ts-ignore
  return new SQL({
    url: connectionUrl,
    max: 20,
    idleTimeout: 30,
    maxLifetime: 0,
    connectionTimeout: 30,
    tls: false,
  });
}

function getConnection(): SQL {
  if (!sqlInstance) {
    sqlInstance = createConnection();
  }
  return sqlInstance;
}

export const sql = getConnection();
