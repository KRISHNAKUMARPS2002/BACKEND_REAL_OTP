const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const { uploadHotelImages } = require("../config/multerConfig");

// Register a new admin
router.post("/register", adminController.registerAdmin);

// Route for verifying OTP during registration
router.post("/verify-otp", adminController.verifyOTP);

// Route for admin login
router.post("/login", adminController.login);

// Middleware to verify token for protected routes
router.use(adminAuth);

// Routes for authenticated admin operations
router.get("/profile", adminController.getAdminProfile);
router.put("/update", adminController.updateAdmin);
router.delete("/delete", adminController.deleteAdmin);

// Routes for hotel operations with file upload middleware
router.post(
  "/hotels",
  adminController.uploadHotelImages, // Apply middleware here
  adminController.createHotel
);

// Route for updating a hotel
router.put(
  "/hotels/:id",
  adminController.uploadHotelImages, // Apply middleware here
  adminController.updateHotel
);

// Route for deleting a hotel
router.delete("/hotels/:id", adminController.deleteHotel);

// Routes for bulk operations on hotels
router.put("/hotels/bulk-update", adminController.bulkUpdateHotels);

router.delete("/hotels/bulk-delete", adminController.bulkDeleteHotels);

module.exports = router;
