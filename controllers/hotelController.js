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

// Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().populate("owner workers");
    logger.info("Fetched all hotels successfully");
    res.status(200).json(hotels);
  } catch (error) {
    logger.error(`Error fetching hotels: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get a single hotel by ID
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate("owner workers");
    if (!hotel) {
      logger.warn(`Hotel not found: ${req.params.id}`);
      return res.status(404).json({ message: "Hotel not found" });
    }
    logger.info(`Fetched hotel details successfully: ${req.params.id}`);
    res.status(200).json(hotel);
  } catch (error) {
    logger.error(`Error fetching hotel details: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
