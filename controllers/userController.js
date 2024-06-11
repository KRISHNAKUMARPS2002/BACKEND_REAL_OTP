const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
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

exports.register = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Please provide all required information" });
  }

  try {
    // Check if the phone number already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Phone number is already registered" });
    }

    const otp = generateNumericOTP();
    await Otp.create({ phoneNumber, otp, createdAt: new Date() });

    const authId = generateUniqueAuthId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      authId,
    });
    logger.info(`User registered: ${username} (${phoneNumber})`);

    await sendOtpViaTwilio(phoneNumber, otp);

    res
      .status(201)
      .json({ msg: "User registered successfully, OTP sent to phone" });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
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

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    logger.info(`User logged in: ${phoneNumber}`);
    res.json({ token });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.getUserByAuthId = async (req, res) => {
  try {
    const authId = req.params.authId;
    const user = await User.findOne({ authId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user details by authId: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Ensure we're using userId from the decoded token
    console.log("User ID from token:", userId); // Log the user ID for debugging

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.updateUser = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ msg: "User updated successfully" });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).send("Server error");
  }
};

// Add a favorite
exports.addFavorite = async (req, res) => {
  try {
    const authId = req.params.authId;
    const { id, title, completed } = req.body;

    const user = await User.findOne({ authId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newFavorite = { id, title, completed, authId };
    user.favorites.push(newFavorite);

    await user.save();

    res.json(user.favorites);
  } catch (error) {
    logger.error(`Error adding favorite: ${error.message}`);
    res.status(500).send("Server error");
  }
};

// Get favorites by authId
exports.getFavoritesByAuthId = async (req, res) => {
  try {
    const authId = req.params.authId;
    const user = await User.findOne({ authId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user.favorites);
  } catch (error) {
    logger.error(`Error fetching favorites: ${error.message}`);
    res.status(500).send("Server error");
  }
};

// Remove a favorite
exports.removeFavorite = async (req, res) => {
  try {
    const authId = req.params.authId;
    const { id } = req.body;

    const user = await User.findOne({ authId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.favorites = user.favorites.filter((fav) => fav.id !== id);

    await user.save();

    res.json(user.favorites);
  } catch (error) {
    logger.error(`Error removing favorite: ${error.message}`);
    res.status(500).send("Server error");
  }
};

module.exports = exports;
