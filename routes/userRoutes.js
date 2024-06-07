const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateToken, createTokens } = require("../utils/jwtUtils");

// Register a new user
router.post("/register", userController.register);

// Verify OTP
router.post("/verify-otp", userController.verifyOTP);

// User login
router.post("/login", userController.login);

// Get user profile (protected route)
router.get("/profile", authMiddleware, userController.getUserProfile);

// Get user details by authId
router.get("/:authId", authMiddleware, userController.getUserByAuthId);

// Add the refresh token endpoint
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const decoded = validateToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newTokens = createTokens({ userId: decoded.userId });
    res.json(newTokens);
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

module.exports = router;
