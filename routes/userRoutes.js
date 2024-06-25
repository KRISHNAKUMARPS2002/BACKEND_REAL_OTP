const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../config/multerConfig");

// Register a new admin
router.post("/register", adminController.registerAdmin);

// Verify OTP
router.post("/verify-otp", adminController.verifyOTP);

// Admin login
router.post("/login", adminController.login);

// Get admin profile (protected route)
router.get("/profile", authMiddleware, adminController.getAdminProfile);

// Update admin details (protected route)
router.put("/update", authMiddleware, adminController.updateAdmin);

// Delete an admin (protected route)
router.delete("/delete", authMiddleware, adminController.deleteAdmin);

// Hotel routes (protected routes)
router.post(
  "/hotels",
  authMiddleware,
  adminController.uploadHotelImages,
  adminController.createHotel
);

router.put(
  "/hotels/:id",
  authMiddleware,
  adminController.uploadHotelImages,
  adminController.updateHotel
);

router.delete("/hotels/:id", authMiddleware, adminController.deleteHotel);

module.exports = router;
