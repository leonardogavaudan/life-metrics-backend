/**
 * Interface for database errors with additional context
 */
export interface DatabaseError extends Error {
  name: "DatabaseError";
  query?: string;
  params?: any[];
  callerStack?: string;
  originalError?: {
    message: string;
    code?: string;
    [key: string]: any;
  };
}

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: any): error is DatabaseError {
  return error && error.name === "DatabaseError";
}

/**
 * Decorator that catches any rejected promises, creates a new Error with context, and throws it
 * while preserving the original stack trace and capturing the call site
 */
export function handleDatabaseErrors<
  T extends (...args: any[]) => Promise<any>
>(target: T): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    // Capture stack trace at call time
    const callSiteError = new Error("Call site capture");
    const callStack =
      callSiteError.stack?.split("\n").slice(2).join("\n") || "";

    try {
      return await target(...args);
    } catch (error) {
      // Create a new error with context information
      const originalError =
        error instanceof Error ? error : new Error(String(error));
      const enhancedError = new Error(
        `Database error in ${target.name}: ${originalError.message}\nCall stack:\n${callStack}`
      ) as DatabaseError;

      // Set the error name to identify it as a database error
      enhancedError.name = "DatabaseError";

      // Add database-specific properties
      enhancedError.callerStack = callStack;
      enhancedError.originalError = {
        message: originalError.message,
        ...(originalError as any),
      };

      // Preserve the original stack trace if available
      if (originalError.stack) {
        const newStack = enhancedError.stack || "";
        const newErrorFirstLine = newStack.split("\n")[0] || "";

        enhancedError.stack = `${newErrorFirstLine}\n${originalError.stack
          .split("\n")
          .slice(1)
          .join("\n")}`;
      }

      // Copy any additional properties from the original error
      Object.assign(enhancedError, originalError);

      throw enhancedError;
    }
  };
}
