const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const twilio = require("twilio");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const winston = require("winston");
const { upload } = require("../config/multerConfig");
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
dotenv.config();

//For deleting images from S3 buckets
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

    // Add console log to print OTP to console
    console.log(`OTP for ${phoneNumber}: ${otp}`);
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
      role: "user",
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

// Admin login
exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    logger.info(`User login attempt: ${phoneNumber}`);
    const user = await Admin.findOne({ phoneNumber });

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

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
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
    const userId = req.user.userId;
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
exports.addFavorite = (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    // Adjust the limit as needed
    if (err) {
      logger.error(`Multer error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    try {
      const authId = req.params.authId;
      const { hotelName, location, description, amenities, rating, roomTypes } =
        req.body;

      const user = await User.findOne({ authId });

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const images = req.files.map((file) => file.location); // Assuming multer-s3 is set to provide `location`

      const newFavorite = {
        hotelName,
        location,
        images, // Array of image URLs
        description,
        amenities,
        rating,
        roomTypes,
        userAuthId: authId,
      };

      // Add the new favorite to the user's favorites array
      user.favorites.push(newFavorite);

      // Save the user to trigger the pre-save hook
      await user.save();

      res.json(user.favorites);
    } catch (error) {
      logger.error(`Error adding favorite: ${error.message}`);
      res.status(500).send("Server error");
    }
  });
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

// Update favorites by authId
exports.updateFavoriteByAuthId = (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      logger.error(`Multer error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    try {
      const authId = req.params.authId;
      const { hotelName, location, description, amenities, rating, roomTypes } =
        req.body;

      const user = await User.findOne({ authId });

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Assuming there's only one favorite per user, update that favorite
      if (user.favorites.length > 0) {
        const favoriteToUpdate = user.favorites[0]; // Assuming only one favorite per user
        if (hotelName) favoriteToUpdate.hotelName = hotelName;
        if (location) favoriteToUpdate.location = location;
        if (description) favoriteToUpdate.description = description;
        if (amenities) favoriteToUpdate.amenities = amenities;
        if (rating) favoriteToUpdate.rating = rating;
        if (roomTypes) favoriteToUpdate.roomTypes = roomTypes;

        if (req.files && req.files.length > 0) {
          const images = req.files.map((file) => file.location); // Assuming multer-s3 is set up to provide `location`
          favoriteToUpdate.images = images;
        }

        await user.save();

        res.json({
          msg: "Favorite updated successfully",
          favorite: favoriteToUpdate, // Assuming only one favorite per user
        });
      } else {
        return res.status(404).json({ msg: "Favorite not found" });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      res.status(500).send("Server error");
    }
  });
};

// Remove a favorite
exports.removeFavorite = async (req, res) => {
  try {
    const authId = req.params.authId;
    const { index } = req.body; // Use the index to identify the favorite

    const user = await User.findOne({ authId });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (index < 0 || index >= user.favorites.length) {
      return res.status(404).json({ msg: "Favorite not found" });
    }

    const favoriteToRemove = user.favorites[index];

    // Remove images from S3
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: favoriteToRemove.images.map((imageUrl) => {
          const Key = imageUrl.split("/").slice(-1)[0]; // Assuming the URL contains the key at the end
          return { Key };
        }),
      },
    };

    await s3.send(new DeleteObjectsCommand(deleteParams));

    // Remove the favorite from the array
    user.favorites.splice(index, 1);

    await user.save();

    res.json(user.favorites);
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).send("Server error");
  }
};

// Upload image
exports.uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!req.file || !req.file.location) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid file" });
    }

    // Store the file URL in the user's photo field
    user.photo = req.file.location;

    await user.save();
    res.json({ msg: "Photo uploaded successfully", photo: user.photo });
  } catch (error) {
    logger.error(`Error uploading photo: ${error.message}`);
    res.status(500).send("Server error");
  }
};

module.exports = exports;
