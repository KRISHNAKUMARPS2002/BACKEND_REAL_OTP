const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Worker = require("../models/Workers");
const Hotel = require("../models/Hotel");
const dotenv = require("dotenv");
const winston = require("winston");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

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

exports.registerWorker = async (req, res) => {
  const { name, position, phoneNumber, email, shiftTiming, hotelId, password } =
    req.body;

  if (
    !name ||
    !position ||
    !phoneNumber ||
    !email ||
    !shiftTiming ||
    !hotelId ||
    !password
  ) {
    return res
      .status(400)
      .json({ error: "Please provide all required information" });
  }

  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const existingWorker = await Worker.findOne({ phoneNumber });
    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Phone number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newWorker = new Worker({
      name,
      position,
      phoneNumber,
      email,
      shiftTiming,
      hotel: hotelId,
      password: hashedPassword,
    });

    await newWorker.save();

    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { workers: newWorker._id },
    });

    logger.info(`Worker registered: ${name} (${phoneNumber})`);
    res.status(201).json({ message: "Worker registered successfully" });
  } catch (error) {
    logger.error(`Error registering worker: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.loginWorker = async (req, res) => {
  const { email, password } = req.body;

  try {
    const worker = await Worker.findOne({ email });

    if (!worker) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, worker.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: worker._id, role: "worker" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    logger.error(`Error logging in worker: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkerByCredentials = async (req, res) => {
  const { name, password, shiftTiming, hotelId } = req.body;
  logger.info("Request body:", req.body); // Log the request body for debugging

  try {
    const worker = await Worker.findOne({
      name,
      shiftTiming,
      hotel: hotelId,
    }).populate("hotel");
    logger.info("Worker found:", worker); // Log the worker found for debugging

    if (!worker) {
      return res
        .status(400)
        .json({ message: "Worker not found or invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, worker.password);
    logger.info("Password match:", isMatch); // Log the password match result for debugging

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Worker not found or invalid credentials" });
    }

    res.json({
      worker: {
        id: worker._id,
        name: worker.name,
        position: worker.position,
        phoneNumber: worker.phoneNumber,
        email: worker.email,
        shiftTiming: worker.shiftTiming,
        hotel: worker.hotel,
      },
    });
  } catch (error) {
    logger.error(`Error retrieving worker by credentials: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
