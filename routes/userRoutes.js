// userRoutes.js

const express = require("express");
const router = express.Router();
const {
  register,
  getUserProfile,
  getUserByAuthId,
} = require("../controllers/userController"); // Add getUserByAuthId controller
const authMiddleware = require("../middleware/authMiddleware");

// Register a new user
router.post("/user/register", register);

// Get user profile (protected route)
router.get("/user/profile", authMiddleware, getUserProfile);

// Get user details by authId
router.get("/user/authId/:authId", getUserByAuthId); // Add this route

module.exports = router;
