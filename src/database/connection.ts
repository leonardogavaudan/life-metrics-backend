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

// @ts-ignore
const originalQuery = sql.query;
// @ts-ignore
sql.query = async function (...args) {
  const callerStack = new Error().stack;
  try {
    return await originalQuery.apply(this, args);
  } catch (err) {
    // @ts-ignore
    const wrappedError = new Error(`Database query failed: ${err.message}`);
    // @ts-ignore
    wrappedError.originalError = err;
    // @ts-ignore
    wrappedError.callerStack = callerStack;
    // @ts-ignore
    wrappedError.args = args;
    throw wrappedError;
  }
};
