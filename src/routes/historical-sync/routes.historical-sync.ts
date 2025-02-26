import { Context, Hono } from "hono";
import { z } from "zod";
import { getContextWithValidation } from "../../context/context";
import { JwtContext, jwtMiddleware } from "../../middleware/middleware.jwt";
import { IntegrationProvidersValidator } from "../../types/types.provider";
import { scheduleHistoricalSync } from "./services.historical-sync";

export const historicalSyncRouter = new Hono();

const HistoricalSyncRequestSchema = z.object({
  provider: IntegrationProvidersValidator,
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for startDate",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for endDate",
  }),
});

historicalSyncRouter.use("*", jwtMiddleware);

historicalSyncRouter.post("/", triggerHistoricalSync);

async function triggerHistoricalSync(c: Context) {
  const context = getContextWithValidation(JwtContext);
  if (!context.success) {
    throw context.error;
  }

  const userId = context.data.user.id;

  const body = await c.req.json();
  const validationResult = HistoricalSyncRequestSchema.safeParse(body);

  if (!validationResult.success) {
    return c.json(
      {
        error: "Invalid request parameters",
        details: validationResult.error.format(),
      },
      { status: 400 }
    );
  }

  const { provider, startDate, endDate } = validationResult.data;

  await scheduleHistoricalSync({
    userId,
    provider,
    startDate,
    endDate,
  });

  return c.json(
    {
      message: "Historical sync scheduled successfully",
      details: {
        userId,
        provider,
        startDate,
        endDate,
      },
    },
    { status: 202 }
  );
}
