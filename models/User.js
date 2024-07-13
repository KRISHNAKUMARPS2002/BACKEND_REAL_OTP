const mongoose = require("mongoose");
const { Schema } = mongoose;

const favoriteSchema = new Schema({
  id: {
    type: Number,
    unique: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: false,
  },
  description: {
    type: String,
    required: true,
  },
  amenities: {
    type: [String],
    required: false,
  },
  rating: {
    type: Number,
    required: false,
    min: 0,
    max: 5,
  },
  roomTypes: {
    type: [String],
    required: false,
  },
  userAuthId: {
    type: String,
    required: true,
  },
});

favoriteSchema.pre("save", async function (next) {
  const favorite = this;
  if (favorite.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { model: "Favorite", field: "id" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    favorite.id = counter.count;
  }
  next();
});

const userSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  authId: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  favorites: [favoriteSchema],
  photo: {
    type: String,
    required: false,
  },
  Userbluetick: {
    type: Boolean,
    default: false,
  },
  usercheckindetails: {
    type: [String],
    default: [],
  },
  LoyalityCheck: {
    type: [String],
    default: [],
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
