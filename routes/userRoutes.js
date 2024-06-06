const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Register a new user
router.post("/register", userController.register);

// Verify OTP
router.post("/verify-otp", userController.verifyOTP);

// User login
router.post("/login", userController.login);

module.exports = router;

// Get user profile (protected route)
router.get("/profile", authMiddleware, userController.getUserProfile);

// Get user details by authId
router.get("/:authId", userController.getUserByAuthId);

module.exports = router;
