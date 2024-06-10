const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const twilio = require("twilio");
const { v4: uuidv4 } = require("uuid"); // Import uuid package for generating authId
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
    console.log(`OTP sent successfully to ${phoneNumber}`);
  } catch (error) {
    console.error("Error sending OTP via Twilio:", error.message);
    throw new Error("Failed to send OTP");
  }
};

// Function to generate a unique authId using UUID
const generateUniqueAuthId = () => {
  return uuidv4();
};

// Register a new user
exports.register = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  try {
    // Check if all required fields are provided
    if (!username || !email || !password || !phoneNumber) {
      return res
        .status(400)
        .json({ error: "Please provide all required information" });
    }

    // Generate OTP
    const otp = generateNumericOTP();

    // Send OTP via SMS using Twilio
    await sendOtpViaTwilio(phoneNumber, otp);

    // Generate a unique authId
    const authId = generateUniqueAuthId();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      authId,
    });

    // Log registration process
    console.log(`User registered: ${username} (${phoneNumber}), OTP: ${otp}`);

    res.status(201).json({ msg: "User registered successfully", otp }); // Include OTP in response for testing
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
    const user = await User.findOne({ authId });

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

// Update user details
exports.updateUser = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;
  const userId = req.user._id; // Extract the authenticated user's ID from the request

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update user details
    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // If password is provided, hash it before saving
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save(); // Save the updated user details

    res.json({ msg: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).send("Server error");
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const userId = req.user._id; // Extract the authenticated user's ID from the request

  try {
    // Find the user by ID and delete
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).send("Server error");
  }
};

module.exports = exports;
