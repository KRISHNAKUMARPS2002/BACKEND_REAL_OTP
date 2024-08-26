const Booking = require("../models/Booking");
const logger = require("../logger");

const bookingNotFoundMessage = "Booking not found.";
const unauthorizedMessage =
  "Access denied. You are not authorized to access this booking.";

module.exports = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id; // Assuming the user ID is attached to req.user by the auth middleware

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      logger.warn(bookingNotFoundMessage);
      return res.status(404).json({ error: bookingNotFoundMessage });
    }

    // Check if the user making the request is the owner of the booking
    if (booking.user.toString() !== userId) {
      logger.warn(unauthorizedMessage);
      return res.status(403).json({ error: unauthorizedMessage });
    }

    // Attach the booking to the request object for use in the next middleware/controller
    req.booking = booking;
    next();
  } catch (error) {
    logger.error("Error checking booking.", error);
    res.status(500).json({ error: "Server error." });
  }
};
