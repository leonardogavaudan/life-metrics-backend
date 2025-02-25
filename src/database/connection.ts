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

// Export the original SQL instance
export const sql = getConnection();

// Add a global error handler for unhandled promise rejections to capture SQL errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);

  // Print the stack trace
  if (reason instanceof Error) {
    console.error("Stack trace:");
    console.error(reason.stack);
  }

  // Don't exit the process, just log the error
  // This allows the application to continue running
});
