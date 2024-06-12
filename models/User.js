const mongoose = require("mongoose");
const Counter = require("../models/Counter"); // Ensure this path is correct based on your project structure

const favoriteSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  title: {
    type: String,
    required: false,
  },
  completed: {
    type: Boolean,
    required: false,
  },
  userAuthId: {
    type: String,
    required: true,
  },
});

const userSchema = new mongoose.Schema({
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
});

// Pre-save hook to handle auto-increment for the favoriteSchema id field
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

const User = mongoose.model("User", userSchema);

module.exports = User;
