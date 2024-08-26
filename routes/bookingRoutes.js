const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const auth = require("../middleware/authMiddleware"); // Authentication middleware
const checkBooking = require("../middleware/bookingMiddleware"); // Booking middleware

// Route to create a booking
// Only authenticated users can create a booking
router.post("/", auth, bookingController.createBooking);

// Route to edit a booking by ID
// Only authenticated and authorized users can edit a booking
router.put("/:bookingId", auth, checkBooking, bookingController.editBooking);

// Route to cancel a booking by ID
// Only authenticated and authorized users can cancel a booking
router.delete(
  "/:bookingId",
  auth,
  checkBooking,
  bookingController.cancelBooking
);

module.exports = router;
