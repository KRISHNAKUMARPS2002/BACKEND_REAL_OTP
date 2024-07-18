// models/Booking.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema({
  hotel: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  checkinDate: { type: Date, required: true },
  checkoutDate: { type: Date, required: true },
  roomType: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
