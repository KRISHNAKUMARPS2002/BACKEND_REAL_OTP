const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Hotel = require("../models/hotelModel"); // Ensure you have a Hotel model
const twilio = require("twilio");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const winston = require("winston");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

const generateNumericOTP = () => Math.floor(1000 + Math.random() * 9000);

const sendOtpViaTwilio = async (phoneNumber, otp) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    logger.info(`OTP sent successfully to ${phoneNumber}`);
  } catch (error) {
    logger.error(`Error sending OTP via Twilio: ${error.message}`);
    throw new Error("Failed to send OTP");
  }
};

const generateUniqueAuthId = () => uuidv4();

exports.registerAdmin = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Please provide all required information" });
  }

  try {
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Phone number is already registered" });
    }

    const otp = generateNumericOTP(); // Generate OTP here
    await Otp.create({ phoneNumber, otp, createdAt: new Date() });

    const authId = generateUniqueAuthId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      authId,
      role: "admin",
    });

    logger.info(`Admin registered: ${username} (${phoneNumber})`);
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`); // Log OTP in the terminal

    // Send OTP via Twilio
    await sendOtpViaTwilio(phoneNumber, otp);

    res.status(201).json({ msg: "Admin registered successfully" });
  } catch (error) {
    logger.error(`Error registering admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const otpRecord = await Otp.findOne({ phoneNumber });
    if (!otpRecord || otpRecord.otp !== otp) {
      logger.warn(`OTP verification failed for user: ${phoneNumber}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteOne({ phoneNumber });
    logger.info(`OTP verified successfully for user: ${phoneNumber}`);

    const user = await User.findOne({ phoneNumber });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ msg: "OTP verified successfully", token });
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    logger.info(`User login attempt: ${phoneNumber}`);
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      logger.warn(
        `Login failed: User with phone number ${phoneNumber} not found`
      );
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for user ${phoneNumber}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    logger.info(`User logged in: ${phoneNumber}`);
    res.json({ token });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    logger.error(`Error fetching admin profile: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.updateAdmin = async (req, res) => {
  const { username, email, phoneNumber } = req.body;

  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (phoneNumber) admin.phoneNumber = phoneNumber;

    await admin.save();
    res.json({ msg: "Admin updated successfully" });
  } catch (error) {
    logger.error(`Error updating admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await admin.remove();
    res.json({ msg: "Admin deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.createHotel = async (req, res) => {
  const { name, location } = req.body;

  try {
    const hotel = new Hotel({
      name,
      location,
      owner: req.user.userId,
    });

    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    logger.error(`Error creating hotel: ${error.message}`);
    res.status(500).json({ error: "Error creating hotel" });
  }
};

exports.updateHotel = async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;

  try {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    if (hotel.owner.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (name) hotel.name = name;
    if (location) hotel.location = location;

    await hotel.save();
    res.json(hotel);
  } catch (error) {
    logger.error(`Error updating hotel: ${error.message}`);
    res.status(500).json({ error: "Error updating hotel" });
  }
};

exports.deleteHotel = async (req, res) => {
  const { id } = req.params;

  try {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    if (hotel.owner.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await hotel.remove();
    res.json({ msg: "Hotel deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting hotel: ${error.message}`);
    res.status(500).json({ error: "Error deleting hotel" });
  }
};

exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.userId });
    res.json(hotels);
  } catch (error) {
    logger.error(`Error fetching hotels: ${error.message}`);
    res.status(500).json({ error: "Error fetching hotels" });
  }
};
