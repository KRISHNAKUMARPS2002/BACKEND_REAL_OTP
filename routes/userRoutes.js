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

// Favorites routes (protected routes)
router.post("/favorites", authMiddleware, userController.addFavorite);

router.get("/favorites", authMiddleware, userController.getFavoritesByAuthId);

router.put(
  "/favorites/:index",
  authMiddleware,
  userController.updateFavoriteByAuthId
);

router.delete(
  "/favorites/:index",
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
