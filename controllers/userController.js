const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const twilio = require("twilio");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to generate a 4-digit numeric OTP
const generateNumericOTP = () => {
  return Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number
};

// Send OTP via SMS using Twilio
const sendOtpViaTwilio = async (phoneNumber, otp) => {
  try {
    await twilioClient.messages.create({
      body: ` Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (error) {
    console.error("Error sending OTP via Twilio:", error.message);
    throw new Error("Failed to send OTP");
  }
};

// Register a new user without saving OTP in the database
exports.register = async (req, res) => {
  const { username, email, password, phoneNumber, authId } = req.body;

  try {
    // Generate OTP
    const otp = generateNumericOTP();

    // Send OTP via SMS using Twilio
    await sendOtpViaTwilio(phoneNumber, otp);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user without saving OTP
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      authId,
    });

    // Log registration process
    console.log(`User registered: ${username} (${phoneNumber}), OTP: ${otp}`);

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).send("Server error");
  }
};

// Verify OTP for user registration (No OTP stored in DB)
exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    // Simulate OTP verification without database check
    // In a real scenario, you would check the OTP against a stored value in the database
    // For demonstration purposes, we'll just return a success response
    console.log(`OTP verification for user: ${phoneNumber}`);
    res.status(200).json({ msg: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    res.status(500).send("Server error");
  }
};

// Login a user
exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    // Log login attempt
    console.log(`User login attempt: ${phoneNumber}`);

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log(
        `Login failed: User with phone number ${phoneNumber} not found`
      );
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`Login failed: Incorrect password for user ${phoneNumber}`);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    console.log(`User logged in: ${phoneNumber}`);
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get user details by authId
exports.getUserByAuthId = async (req, res) => {
  try {
    const authId = req.params.authId;

    // Query the database using the authId
    const user = await User.findOne({ authId }); // Replace with your actual query

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details by authId:", error.message);
    res.status(500).send("Server error");
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Extract the authenticated user's ID from the request

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).send("Server error");
  }
};

module.exports = exports;
