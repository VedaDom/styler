import pino from "pino";

// Ensure a singleton logger across hot reloads in Next.js dev
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForLogger = global as any as { logger?: pino.Logger };

export const logger: pino.Logger =
  globalForLogger.logger ||
  pino({
    name: "styler",
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  });

if (!globalForLogger.logger) globalForLogger.logger = logger;
