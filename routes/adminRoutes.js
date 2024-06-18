const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");

// Register a new admin
router.post("/register", adminController.registerAdmin);

// Verify OTP for admin
router.post("/verify-otp", adminController.verifyOTP);

// Admin login
router.post("/login", adminController.login);

// Get admin profile (protected route)
router.get("/profile", auth, adminAuth, adminController.getAdminProfile);

// Add the refresh token endpoint for admin
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

// Update admin details (protected route)
router.put("/update", auth, adminAuth, adminController.updateAdmin);

// Delete an admin (protected route)
router.delete("/delete", auth, adminAuth, adminController.deleteAdmin);

// Admin-specific routes for managing hotels
router.post("/hotels", auth, adminAuth, adminController.createHotel);
router.put("/hotels/:id", auth, adminAuth, adminController.updateHotel);
router.delete("/hotels/:id", auth, adminAuth, adminController.deleteHotel);
router.get("/hotels", auth, adminAuth, adminController.getHotels);

module.exports = router;
