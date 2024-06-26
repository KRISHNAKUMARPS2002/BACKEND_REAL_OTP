const express = require("express");
const workerController = require("../controllers/workerController");
const workerAuth = require("../middleware/workerAuth");

const router = express.Router();

// Register Worker
router.post("/register", workerController.registerWorker);

// Login Worker
router.post("/login", workerController.loginWorker);

// Get Worker by Credentials
router.post(
  "/getByCredentials",
  workerAuth,
  workerController.getWorkerByCredentials
);

module.exports = router;
