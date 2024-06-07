const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: combine(errors({ stack: true }), timestamp(), customFormat),
  transports: [
    new transports.DailyRotateFile({
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [new transports.Console()]
      : []),
  ],
});

module.exports = logger;
