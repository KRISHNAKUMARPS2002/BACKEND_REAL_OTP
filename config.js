require("dotenv").config();
const assert = require("assert");
const winston = require("winston");

// Setup Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const { NODE_ENV, MONGODB_URI, JWT_SECRET, PORT } = process.env;

// Validate required configurations
assert(MONGODB_URI, "MONGODB_URI is required");
assert(JWT_SECRET, "JWT_SECRET is required");

logger.info(`Environment: ${NODE_ENV || "development"}`);

module.exports = {
  NODE_ENV: NODE_ENV || "development",
  MONGODB_URI,
  JWT_SECRET,
  PORT,
  logger,
};
