// userController.js

const User = require("../models/User"); // Assuming you have a User model

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
