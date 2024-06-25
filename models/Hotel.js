const mongoose = require("mongoose");
const { Schema } = mongoose;

const hotelSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  images: [String], // Array of image URLs
  amenities: [String], // Array of amenities
  description: { type: String },
  contactNumber: { type: String },
  workers: [{ type: Schema.Types.ObjectId, ref: "Worker" }],
});

const Hotel = mongoose.model("Hotel", hotelSchema);
module.exports = Hotel;
