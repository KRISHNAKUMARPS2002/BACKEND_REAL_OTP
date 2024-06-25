// models/Otp.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows the field to be optional and unique
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows the field to be optional and unique
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "5m" }, // OTP expires after 5 minutes
  },
});

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
