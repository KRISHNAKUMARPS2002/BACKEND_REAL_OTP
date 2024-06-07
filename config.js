require("dotenv").config();
const winston = require("winston");

// Setup Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    // Add file transport for production
    ...(process.env.NODE_ENV === "production"
      ? [new winston.transports.File({ filename: "combined.log" })]
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
