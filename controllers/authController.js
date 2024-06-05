const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming you have a User model
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
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (error) {
    console.error("Error sending OTP via Twilio:", error.message);
    throw new Error("Failed to send OTP");
  }
};

// Register a new user
exports.register = async (req, res) => {
  const { username, password, phoneNumber, role } = req.body;

  try {
    // Generate OTP
    const otp = generateNumericOTP();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      phoneNumber,
      otpCode: otp, // Add this field to your User model
    });

    // Send OTP via SMS using Twilio
    await sendOtpViaTwilio(phoneNumber, otp);

    // Log registration process
    console.log(`User registered: ${username} (${phoneNumber}), OTP: ${otp}`);

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).send("Server error");
  }
};

// Verify OTP for user registration
exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const user = await User.findOne({ phoneNumber, otpCode: otp });

    if (!user) {
      console.log(`OTP verification failed for user: ${phoneNumber}`);
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // Update user status to 'verified' and clear OTP code
    user.status = "verified"; // Assuming you have a 'status' field in your User model
    user.otpCode = null;
    await user.save();

    // Log OTP verification process
    console.log(`OTP verified for user: ${phoneNumber}`);

    res
      .status(200)
      .json({ msg: "OTP verified successfully. User status updated." });
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
