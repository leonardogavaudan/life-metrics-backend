import { Hono } from "hono";
import { JwtContext, jwtMiddleware } from "../../middleware/jwt";
import { getContextWithValidation } from "../../context";
import {
  getUserPreferencesWithIntegrationsByUserId,
  softDeleteUserPreferenceByUserIdAndMetricType,
  upsertUserPreferenceByUserIdAndMetricType,
} from "../../database/user-preferences/database.user-preferences";
import {
  MetricTypes,
  MetricTypeToCategory,
  MetricTypeToDisplayName,
  MetricTypeToProviders,
  MetricTypeValidator,
} from "../../types/types.metrics";
import { getIntegrationsByUserId } from "../../database/integration";
import { IntegrationProvidersValidator } from "../../types/types.provider";
import { getIntegrationByUserIdAndProvider } from "../../database/integration";

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

userPreferencesRouter.put("/:metricType", jwtMiddleware, async (c) => {
  const context = getContextWithValidation(JwtContext);
  if (!context.success) {
    throw context.error;
  }
  const userId = context.data.user.id;
  const metricType = c.req.param("metricType");
  const metricTypeParsed = MetricTypeValidator.safeParse(metricType);
  if (!metricTypeParsed.success) {
    return c.json({ error: "Invalid metric type" }, 400);
  }

  const { provider } = await c.req.json();
  if (!provider) {
    return c.json({ error: "Provider is required" }, 400);
  }

  const providerParsed = IntegrationProvidersValidator.safeParse(provider);
  if (!providerParsed.success) {
    return c.json({ error: "Invalid provider" }, 400);
  }

  const integration = await getIntegrationByUserIdAndProvider(
    userId,
    providerParsed.data
  );
  if (!integration) {
    return c.json({ error: "Integration not found for provider" }, 404);
  }

  await upsertUserPreferenceByUserIdAndMetricType(userId, metricType, {
    preferred_integration_id: integration.id,
  });
  return c.json({ message: "User preference updated" }, 200);
});

userPreferencesRouter.delete("/:metricType", jwtMiddleware, async (c) => {
  const context = getContextWithValidation(JwtContext);
  if (!context.success) {
    throw context.error;
  }
  const userId = context.data.user.id;
  const metricType = c.req.param("metricType");
  const metricTypeParsed = MetricTypeValidator.safeParse(metricType);
  if (!metricTypeParsed.success) {
    return c.json({ error: "Invalid metric type" }, 400);
  }

  await softDeleteUserPreferenceByUserIdAndMetricType(userId, metricType);
  return c.json({ message: "User preference deleted" }, 200);
});
