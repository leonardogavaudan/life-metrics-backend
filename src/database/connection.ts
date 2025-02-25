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

// Get the raw SQL instance
const rawSql = getConnection();

// Create a function that wraps SQL template literals with error handling
function enhancedSqlQuery(strings: TemplateStringsArray, ...values: any[]) {
  // Capture the stack trace at the point of SQL call
  const stackCapture = new Error().stack;

  // Return a promise that will handle any errors
  return Promise.resolve().then(async () => {
    try {
      // Execute the original SQL query
      return await rawSql(strings, ...values);
    } catch (error) {
      // Enhance the error with the captured stack trace
      if (error instanceof Error) {
        console.error("PostgreSQL Error Details:");
        console.error(error);
        console.error("\nOriginal Stack Trace:");
        console.error(stackCapture);

        // Preserve the original error type and properties
        error.stack = `${error.stack}\n\nOriginal call stack:\n${stackCapture}`;
      }

      // Re-throw the enhanced error
      throw error;
    }
  });
}

// Create a tagged template function that behaves like the original SQL function
export const sql = (strings: TemplateStringsArray, ...values: any[]) =>
  enhancedSqlQuery(strings, ...values);
