require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI environment variable is not defined");
}

const connectWithRetry = () => {
  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds for server selection
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error(
        "Error connecting to MongoDB, retrying in 5 seconds...",
        err
      );
      setTimeout(connectWithRetry, 9000); // Retry connection after 5 seconds
    });
};

connectWithRetry();

// Routes
const userRoutes = require("./routes/userRoutes");

app.use("/api/user", userRoutes);

// Start the server
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
