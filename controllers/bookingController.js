const Booking = require("../models/Booking");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Helper function to find a hotel by name
const findHotelByName = async (hotelName) => {
  return await Hotel.findOne({
    name: { $regex: new RegExp(hotelName, "i") },
  });
};

// Helper function to find a user by ID
const findUserById = async (userId) => {
  return await User.findById(userId);
};

exports.createBooking = async (req, res) => {
  try {
    const {
      hotelName,
      userId,
      checkinDate,
      checkoutDate,
      roomType,
      totalPrice,
    } = req.body;

    const hotel = await findHotelByName(hotelName);
    const user = await findUserById(userId);

    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newBooking = new Booking({
      hotel: hotel._id,
      user: userId,
      checkinDate,
      checkoutDate,
      roomType,
      totalPrice,
    });

    await newBooking.save();

    user.bookings.push(newBooking._id);
    await user.save();

    hotel.bookings.push(newBooking._id);
    await hotel.save();

    logger.info(`Booking created successfully: ${newBooking._id}`);
    res.json(newBooking);
  } catch (error) {
    logger.error(`Error creating booking: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.editBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkinDate, checkoutDate, roomType, totalPrice } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      logger.warn(`Booking not found for editing: ${bookingId}`);
      return res.status(404).json({ msg: "Booking not found" });
    }

    booking.checkinDate = checkinDate || booking.checkinDate;
    booking.checkoutDate = checkoutDate || booking.checkoutDate;
    booking.roomType = roomType || booking.roomType;
    booking.totalPrice = totalPrice || booking.totalPrice;

    await booking.save();

    logger.info(`Booking updated successfully: ${bookingId}`);
    res.json(booking);
  } catch (error) {
    logger.error(`Error editing booking: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      logger.warn(`Booking not found for cancellation: ${bookingId}`);
      return res.status(404).json({ msg: "Booking not found" });
    }

    await Booking.findByIdAndDelete(bookingId);

    logger.info(`Booking canceled successfully: ${bookingId}`);
    res.json({ msg: "Booking canceled successfully" });
  } catch (error) {
    logger.error(`Error canceling booking: ${error.message}`);
    res.status(500).send("Server error");
  }
};
