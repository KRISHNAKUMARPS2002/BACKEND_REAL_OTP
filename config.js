require("dotenv").config();
const winston = require("winston");
require("winston-daily-rotate-file");

// Setup Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // Include stack trace in errors
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    // Add file transport with daily rotation for production
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.DailyRotateFile({
            filename: "logs/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: "logs/exceptions-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: "logs/rejections-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
});

const { NODE_ENV, MONGODB_URI, JWT_SECRET, PORT } = process.env;

// Validate required configurations
if (!MONGODB_URI || !JWT_SECRET) {
  logger.error("Critical environment variables are missing");
  process.exit(1);
}

logger.info(`Environment: ${NODE_ENV || "development"}`);

module.exports = {
  NODE_ENV: NODE_ENV || "development",
  MONGODB_URI,
  JWT_SECRET,
  PORT: PORT || 3000, // Default port if not specified
  logger,
};
