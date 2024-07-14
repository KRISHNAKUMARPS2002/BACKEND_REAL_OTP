const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../config/multerConfig");

// User registration
router.post("/register", userController.register);

// Verify OTP
router.post("/verify-otp", userController.verifyOTP);

// User login
router.post("/login", userController.login);

// Get user profile (protected route)
router.get("/profile", authMiddleware, userController.getUserProfile);

// Update user details (protected route)
router.put("/update", authMiddleware, userController.updateUser);

// Delete a user (protected route)
router.delete("/delete", authMiddleware, userController.deleteUser);

// Verify user blue tick (protected route)
router.post(
  "/verify-bluetick",
  authMiddleware,
  userController.verifyUserBlueTick
);

// Add user check-in details (protected route)
router.post(
  "/checkin-details",
  authMiddleware,
  userController.addUserCheckinDetails
);

// Check loyalty status (protected route)
router.get(
  "/loyalty-status",
  authMiddleware,
  userController.checkLoyaltyStatus
);

// Favorites routes (protected routes)
router.post("/favorites/:authId", authMiddleware, userController.addFavorite);

router.get(
  "/favorites/:authId",
  authMiddleware,
  userController.getFavoritesByAuthId
);

router.put(
  "/favorites/:authId/:index",
  authMiddleware,
  userController.updateFavoriteByAuthId
);

router.delete(
  "/favorites/:authId/:index",
  authMiddleware,
  userController.removeFavorite
);

// Upload photo (protected route)
router.post(
  "/upload-photo",
  authMiddleware,
  upload.single("photo"),
  userController.uploadPhoto
);

module.exports = router;
