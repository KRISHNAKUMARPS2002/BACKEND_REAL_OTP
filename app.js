const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const mongoUri = config.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

const connectWithRetry = () => {
  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds for server selection
    })
    .then(() => {
      config.logger.info("Connected to MongoDB");
    })
    .catch((err) => {
      config.logger.error(
        "Error connecting to MongoDB, retrying in 5 seconds...",
        err
      );
      setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });
};

connectWithRetry();

// Routes
const userRoutes = require("./routes/userRoutes");

app.use("/api/user", userRoutes);

// Start the server
const PORT = config.PORT || 3000; // Use PORT from config or default to 3000
app.listen(PORT, () => {
  config.logger.info(
    `Server running in ${config.NODE_ENV} mode on port ${PORT}`
  );
});
