import postgres from "postgres";

const sql = postgres({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
});

export { sql };
