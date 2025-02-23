import { Hono } from "hono";
import { JwtContext, jwtMiddleware } from "../../middleware/jwt";
import { getContextWithValidation } from "../../context";
import { getUserPreferencesWithIntegrationsByUserId } from "../../database/user-preferences/database.user-preferences";
import {
  MetricTypes,
  MetricTypeToCategory,
  MetricTypeToDisplayName,
  MetricTypeToProviders,
} from "../../types/types.metrics";
import { getIntegrationsByUserId } from "../../database/integration";

export const userPreferencesRouter = new Hono();

userPreferencesRouter.get("/", jwtMiddleware, async (c) => {
  const context = getContextWithValidation(JwtContext);
  if (!context.success) {
    throw context.error;
  }
  const userId = context.data.user.id;
  const userPreferences = await getUserPreferencesWithIntegrationsByUserId(
    userId
  );
  console.log("userPreferences: ", userPreferences);
  const metricTypeToPreferredProvider = Object.fromEntries(
    userPreferences.map((userPreference) => [
      userPreference.metric_type,
      // @ts-ignore
      userPreference.integration.provider,
    ])
  );
  const integrations = await getIntegrationsByUserId(userId);
  const integratedProviders = new Set(
    integrations.map((integration) => integration.provider)
  );
  const responseBody = {
    metrics: Object.values(MetricTypes).map((metricType) => {
      return {
        type: metricType,
        displayName: MetricTypeToDisplayName[metricType],
        category: MetricTypeToCategory[metricType],
        supportedProviders: MetricTypeToProviders[metricType].map(
          (provider) => {
            return {
              provider: provider,
              isIntegrated: integratedProviders.has(provider),
            };
          }
        ),
        selectedProvider: metricTypeToPreferredProvider[metricType] || null,
      };
    }),
  };
  return c.json(responseBody);
});
