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

const originalSql = getConnection();

export const sql = new Proxy(originalSql, {
  apply: function (target, thisArg, args) {
    const callerStack = new Error().stack;
    // @ts-ignore
    const queryPromise = target.apply(thisArg, args);

    return queryPromise.then(
      (result) => result,
      (err) => {
        // Create a cleaner error object with better structure
        const wrappedError = new Error(`Database query failed: ${err.message}`);
        // @ts-ignore
        wrappedError.name = "DatabaseError";
        // @ts-ignore
        wrappedError.originalError = err;
        // @ts-ignore
        wrappedError.callerStack = callerStack;

        // Only include the first argument if it's a template strings array
        // This avoids including rejected promises in the error output
        if (args[0] && args[0].raw) {
          // @ts-ignore
          wrappedError.query = args[0].raw.join("?");
          // @ts-ignore
          wrappedError.params = args
            .slice(1)
            .filter((param) => !(param instanceof Promise));
        } else {
          // @ts-ignore
          wrappedError.args = args.filter((arg) => !(arg instanceof Promise));
        }

        throw wrappedError;
      }
    );
  },
});
