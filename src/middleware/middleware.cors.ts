import {cors} from "hono/cors";

export const corsMiddleware = cors({
    origin: (origin, c) => {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return "*";

        // Allow localhost for development and the production domain
        if (origin.includes("localhost") ||
            origin.includes("app.lifemetrics.io")) {
            return origin;
        }

        return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Environment",
        "User-Agent",
        "Referer",
        "Origin",
    ],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours in seconds
    credentials: true,
});
