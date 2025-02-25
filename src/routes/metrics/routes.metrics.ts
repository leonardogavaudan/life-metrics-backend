import { Context, Hono } from "hono";
import { getContextWithValidation } from "../../context";
import { JwtContext, jwtMiddleware } from "../../middleware/jwt";
import {
  getUserPreferencesWithIntegrationsByUserId,
  UserPreferences,
} from "../../database/user-preferences/database.user-preferences";
import {
  AveragedMetrics,
  DailyMetrics,
  MetricType,
  MetricTypeToDefaultPreferredProviders,
  MetricTypeValidator,
  shouldAverageMetric,
} from "../../types/types.metrics";
import {
  AggregationTypes,
  TimeRange,
  TimeRangeToAggregationType,
  TimeRangeValidator,
  TimeUnits,
} from "../../types/types.time";
import { getIntegrationsByUserId } from "../../database/integration/database.integration";
import { IntegrationProvider } from "../../types/types.provider";
import { Integration } from "../../database/integration/types";
import {
  getIntegrationDailyMetricsByMetricTypeAndIntegrationIdAndTimeRange,
  IntegrationDailyMetric,
} from "../../database/integration-daily-metric/database.integration-daily-metric";
import {
  add,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  sub,
  format,
} from "date-fns";
import {
  GetDashboardMetricResponse,
  MetricDataPoint,
} from "./routes.metric.types";
import {
  getTimeSeriesMetricsByUserIdAndMetricType,
  TimeSeriesMetric,
} from "../../database/timeseries-daily-metric/database.timeseries-daily-metric";

export const metricsRouter = new Hono();

metricsRouter.get("/dashboard", jwtMiddleware, getDashBoardMetrics);

async function getDashBoardMetrics(c: Context) {
  const context = getContextWithValidation(JwtContext);
  if (!context.success) {
    throw context.error;
  }
  const userId = context.data.user.id;
  const metricType = c.req.query("metric");
  const metricTypeParsed = MetricTypeValidator.safeParse(metricType);
  if (!metricTypeParsed.success) {
    return c.json({ error: "Invalid metric type" }, 400);
  }
  const timeRange = c.req.query("timeRange");
  const timeRangeParsed = TimeRangeValidator.safeParse(timeRange);
  if (!timeRangeParsed.success) {
    return c.json({ error: "Invalid time range" }, 400);
  }

  const integrationDetails = await getIntegrationProviderForMetricType(
    userId,
    metricTypeParsed.data
  );
  if (!integrationDetails) {
    return c.json<GetDashboardMetricResponse>(
      {
        data: [],
        metadata: null,
      },
      200
    );
  }

  const timeSlots = getTimeSlots(timeRangeParsed.data);
  if (!timeSlots.length) throw new Error("Timeslots must not be empty");
  const startDate = timeSlots[0].start;
  const endDate = timeSlots[timeSlots.length - 1].end;

  if (metricTypeParsed.data in DailyMetrics) {
    const metrics =
      await getIntegrationDailyMetricsByMetricTypeAndIntegrationIdAndTimeRange(
        metricTypeParsed.data,
        integrationDetails.integrationId,
        { startDate, endDate }
      );
    if (!metrics.length) {
      return c.json<GetDashboardMetricResponse>(
        {
          data: [],
          metadata: null,
        },
        200
      );
    }

    const dataPoints = processMetricsForTimeSlots(
      metrics,
      timeSlots,
      metricTypeParsed.data
    );

    const summary = calculateSummary(dataPoints, metricTypeParsed.data);

    return c.json<GetDashboardMetricResponse>({
      data: dataPoints,
      metadata: {
        metricType: metricTypeParsed.data,
        timeRange: timeRangeParsed.data,
        aggregation: TimeRangeToAggregationType[timeRangeParsed.data],
        unit: metrics[0]?.unit || "",
        summary,
      },
    });
  } else {
    const metrics = await getTimeSeriesMetricsByUserIdAndMetricType(
      userId,
      metricTypeParsed.data,
      startDate,
      endDate
    );

    if (!metrics.length) {
      return c.json<GetDashboardMetricResponse>(
        {
          data: [],
          metadata: null,
        },
        200
      );
    }

    const dataPoints = processTimeSeriesMetricsForTimeSlots(
      metrics,
      timeSlots,
      metricTypeParsed.data
    );

    const summary = calculateSummary(dataPoints, metricTypeParsed.data);

    return c.json<GetDashboardMetricResponse>({
      data: dataPoints,
      metadata: {
        metricType: metricTypeParsed.data,
        timeRange: timeRangeParsed.data,
        aggregation: TimeRangeToAggregationType[timeRangeParsed.data],
        unit: metrics[0]?.unit || "",
        summary,
      },
    });
  }
}

function processMetricsForTimeSlots(
  metrics: IntegrationDailyMetric[],
  timeSlots: { start: Date; end: Date }[],
  metricType: MetricType
): MetricDataPoint[] {
  const isAveraged = shouldAverageMetric(metricType);

  return timeSlots.map((slot) => {
    const metricsInSlot = metrics.filter((metric) => {
      const metricDate = new Date(metric.event_date);
      return metricDate >= slot.start && metricDate < slot.end;
    });

    if (!metricsInSlot.length) {
      return {
        timestamp: slot.start.toISOString(),
        value: 0,
      };
    }

    const sum = metricsInSlot.reduce((acc, metric) => acc + metric.value, 0);

    return {
      timestamp: slot.start.toISOString(),
      value: isAveraged ? sum / metricsInSlot.length : sum,
    };
  });
}

function processTimeSeriesMetricsForTimeSlots(
  metrics: TimeSeriesMetric[],
  timeSlots: { start: Date; end: Date }[],
  metricType: MetricType
): MetricDataPoint[] {
  const isAveraged = shouldAverageMetric(metricType);

  return timeSlots.map((slot) => {
    const metricsInSlot = metrics.filter((metric) => {
      const metricTimestamp = new Date(metric.event_timestamp);
      return metricTimestamp >= slot.start && metricTimestamp < slot.end;
    });

    if (!metricsInSlot.length) {
      return {
        timestamp: slot.start.toISOString(),
        value: 0,
      };
    }

    const sum = metricsInSlot.reduce((acc, metric) => acc + metric.value, 0);

    return {
      timestamp: slot.start.toISOString(),
      value: isAveraged ? sum / metricsInSlot.length : sum,
    };
  });
}

function calculateSummary(
  dataPoints: MetricDataPoint[],
  metricType: MetricType
): { average?: number; trend?: number; changePercentage?: number } {
  if (!dataPoints.length) {
    return {};
  }

  const nonZeroPoints = dataPoints.filter((point) => point.value > 0);
  const average =
    nonZeroPoints.length > 0
      ? nonZeroPoints.reduce((acc, point) => acc + point.value, 0) /
        nonZeroPoints.length
      : 0;

  const nonZeroValues = nonZeroPoints.map((point) => point.value);
  const firstValue = nonZeroValues[0] || 0;
  const lastValue = nonZeroValues[nonZeroValues.length - 1] || 0;
  const trend = lastValue - firstValue;

  const changePercentage =
    firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  return {
    average,
    trend,
    changePercentage,
  };
}

function getTimeSlots(range: TimeRange): { start: Date; end: Date }[] {
  const [valueStr, unit] = range.split("_");
  const value = Number(valueStr);
  const aggregation = TimeRangeToAggregationType[range];

  const now = new Date();
  const intervals: { start: Date; end: Date }[] = [];

  let endDate: Date;

  switch (aggregation) {
    case AggregationTypes.Daily:
      endDate = endOfDay(now);
      break;
    case AggregationTypes.Weekly:
      endDate = endOfWeek(now);
      break;
    case AggregationTypes.Monthly:
      endDate = endOfMonth(now);
      break;
    case AggregationTypes.Quarterly:
      const monthInQuarter = Math.floor(now.getMonth() / 3) * 3 + 2;
      const endOfQuarter = new Date(now.getFullYear(), monthInQuarter + 1, 0);
      endDate = endOfDay(endOfQuarter);
      break;
    default:
      throw new Error(`Unsupported aggregation type: ${aggregation}`);
  }

  let startDate: Date;

  switch (unit) {
    case TimeUnits.Day:
      startDate = startOfDay(sub(endDate, { days: value }));
      break;
    case TimeUnits.Week:
      startDate = startOfWeek(sub(endDate, { weeks: value }));
      break;
    case TimeUnits.Month:
      startDate = startOfMonth(sub(endDate, { months: value }));
      break;
    case TimeUnits.Year:
      startDate = startOfYear(sub(endDate, { years: value }));
      break;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }

  switch (aggregation) {
    case AggregationTypes.Daily:
      let currentDay = startDate;
      while (currentDay <= endDate) {
        const nextDay = add(currentDay, { days: 1 });
        intervals.push({
          start: currentDay,
          end: nextDay > endDate ? endDate : nextDay,
        });
        currentDay = nextDay;
      }
      break;

    case AggregationTypes.Weekly:
      let currentWeek = startDate;
      while (currentWeek <= endDate) {
        const nextWeek = add(currentWeek, { weeks: 1 });
        intervals.push({
          start: currentWeek,
          end: nextWeek > endDate ? endDate : nextWeek,
        });
        currentWeek = nextWeek;
      }
      break;

    case AggregationTypes.Monthly:
      let currentMonth = startDate;
      while (currentMonth <= endDate) {
        const nextMonth = add(currentMonth, { months: 1 });
        intervals.push({
          start: currentMonth,
          end: nextMonth > endDate ? endDate : nextMonth,
        });
        currentMonth = nextMonth;
      }
      break;

    case AggregationTypes.Quarterly:
      let currentQuarter = startDate;
      while (currentQuarter <= endDate) {
        const nextQuarter = add(currentQuarter, { months: 3 });
        intervals.push({
          start: currentQuarter,
          end: nextQuarter > endDate ? endDate : nextQuarter,
        });
        currentQuarter = nextQuarter;
      }
      break;

    default:
      throw new Error(`Unsupported aggregation type: ${aggregation}`);
  }

  return intervals;
}

async function getIntegrationProviderForMetricType(
  userId: string,
  metricType: MetricType
): Promise<{
  integrationProvider: IntegrationProvider;
  integrationId: Integration["id"];
} | null> {
  const userPreferencesWithIntegrations =
    await getUserPreferencesWithIntegrationsByUserId(userId);
  const preference = userPreferencesWithIntegrations.find(
    (
      preference
    ): preference is UserPreferences & {
      preferred_integration_id: string;
      preferred_integration_provider: IntegrationProvider;
    } =>
      preference.metric_type === metricType &&
      preference.preferred_integration_id !== null
  );
  if (preference) {
    return {
      integrationProvider: preference.preferred_integration_provider,
      integrationId: preference.preferred_integration_id,
    };
  }

  const userIntegrations = await getIntegrationsByUserId(userId);
  const providerToIntegrations = userIntegrations.reduce((acc, integration) => {
    acc[integration.provider] = integration;
    return acc;
  }, {} as Record<IntegrationProvider, Integration>);

  const provider = MetricTypeToDefaultPreferredProviders[metricType].find(
    (provider): provider is IntegrationProvider =>
      provider in providerToIntegrations
  );
  if (!provider) {
    return null;
  }

  return {
    integrationProvider: provider,
    integrationId: providerToIntegrations[provider].id,
  };
}
