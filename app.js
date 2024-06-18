const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const path = require("path");
const config = require("./config");
const logger = require("./logger");

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

// Body parser middleware is now part of Express
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB with retry logic
const mongoUri = config.MONGODB_URI;
if (!mongoUri) {
  logger.error("MONGODB_URI environment variable is not defined");
  process.exit(1);
}

const connectWithRetry = () => {
  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    })
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => {
      logger.error(
        "MongoDB connection unsuccessful, retry after 5 seconds.",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// User Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

// Admin Routes
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error("An unexpected error occurred:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "An unexpected error occurred" });
});

const PORT = config.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});
