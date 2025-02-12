import { AsyncLocalStorage } from "node:async_hooks";
import { z } from "zod";

export const contextStorage = new AsyncLocalStorage();

export const createNewContext = (context: Record<string, unknown>) => {
  return { ...(contextStorage.getStore() ?? {}), ...context }
}

export const getContextWithValidation = <V extends z.ZodTypeAny>(
  validator: V
): z.SafeParseReturnType<unknown, z.infer<V>> => {
  const context = contextStorage.getStore();
  if (!context) {
    throw new Error("Context not found");
  }
  return validator.safeParse(context);
};

