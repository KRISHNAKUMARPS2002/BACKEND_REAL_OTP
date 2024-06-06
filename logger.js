const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors } = format;

// Define a custom format for log messages
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: "info", // Adjust the log level as needed
  format: combine(
    errors({ stack: true }), // Include stack trace if available
    timestamp(),
    customFormat
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: "error.log", level: "error" }), // Log errors to a file
    new transports.File({ filename: "combined.log" }), // Log all messages to a file
  ],
});

module.exports = logger;
