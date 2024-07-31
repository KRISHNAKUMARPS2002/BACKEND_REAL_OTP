const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Otp = require("../models/Otp");
const Hotel = require("../models/Hotel");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const winston = require("winston");
const nodemailer = require("nodemailer");
const { upload, s3 } = require("../config/multerConfig");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Configure NodeMailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

const sendOtpViaEmail = async (email, otp) => {
  try {
    if (!email) {
      logger.error("No email address provided for OTP sending.");
      throw new Error("No email address provided");
    }

    // Validate that the email is a Gmail address
    if (!email.endsWith("@gmail.com")) {
      logger.error(`Invalid email domain: ${email}`);
      throw new Error(
        "Invalid email domain. Only Gmail addresses are allowed."
      );
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}`,
    };

    logger.info(`Sending OTP to ${email}`);
    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent successfully to ${email}`);
  } catch (error) {
    logger.error(`Error sending OTP via email: ${error.message}`);
    throw new Error("Failed to send OTP");
  }
};

const generateUniqueAuthId = () => uuidv4();

exports.registerAdmin = async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!username || !email || !password || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Please provide all required information" });
  }

  try {
    const existingAdmin = await Admin.findOne({ phoneNumber });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ error: "Phone number is already registered" });
    }

    const otp = generateNumericOTP();
    await Otp.create({ phoneNumber, email, otp, createdAt: new Date() });

    const authId = generateUniqueAuthId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      authId,
      role: "admin",
    });

    logger.info(`Admin registered: ${username} (${phoneNumber})`);
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`); // Log OTP in the terminal

    // Log the email address
    logger.info(`Sending OTP to email: ${email}`);

    // Send OTP via email
    await sendOtpViaEmail(email, otp);

    res.status(201).json({ msg: "Admin registered successfully" });
  } catch (error) {
    logger.error(`Error registering admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.verifyOTP = async (req, res) => {
  const { phoneNumber, email, otp } = req.body;

  try {
    const otpRecord = await Otp.findOne({ $or: [{ phoneNumber }, { email }] });
    if (!otpRecord || otpRecord.otp !== otp) {
      logger.warn(`OTP verification failed for user: ${phoneNumber || email}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteOne({ $or: [{ phoneNumber }, { email }] });
    logger.info(`OTP verified successfully for user: ${phoneNumber || email}`);

    const admin = await Admin.findOne({ phoneNumber });
    const token = jwt.sign({ userId: admin._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ msg: "OTP verified successfully", token });
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    res.status(500).send("Server error");
  }
};

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

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    logger.error(`Error fetching admin profile: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.updateAdmin = async (req, res) => {
  const { username, email, phoneNumber } = req.body;

  try {
    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (phoneNumber) admin.phoneNumber = phoneNumber;

    await admin.save();
    res.json({ msg: "Admin updated successfully" });
  } catch (error) {
    logger.error(`Error updating admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await admin.remove();
    res.json({ msg: "Admin deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting admin: ${error.message}`);
    res.status(500).send("Server error");
  }
};

// Middleware for handling image uploads
exports.uploadHotelImages = upload.array("images", 10); // max 10 images

exports.createHotel = async (req, res) => {
  const {
    name,
    location,
    address,
    propertyDetails,
    amenities,
    description,
    contactNumber,
  } = req.body;
  const imageUrls = req.files.map((file) => file.location); // Assuming Multer uploads images correctly

  try {
    // Create hotel instance with image URLs from S3
    const hotel = new Hotel({
      name,
      location,
      address,
      propertyDetails: propertyDetails || {},
      owner: req.user.userId,
      amenities: amenities ? amenities.split(",") : [],
      description,
      contactNumber,
      images: imageUrls, // Assigning S3 image URLs
    });

    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    logger.error(`Error creating hotel: ${error.message}`);
    res.status(500).json({ error: "Error creating hotel" });
  }
};

exports.updateHotel = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    location,
    address,
    propertyDetails,
    amenities,
    description,
    contactNumber,
  } = req.body;

  try {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    if (hotel.owner.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    hotel.name = name || hotel.name;
    hotel.location = location || hotel.location;
    hotel.address = address || hotel.address;
    hotel.propertyDetails = propertyDetails || hotel.propertyDetails;
    hotel.amenities = amenities ? amenities.split(",") : hotel.amenities;
    hotel.description = description || hotel.description;
    hotel.contactNumber = contactNumber || hotel.contactNumber;

    // Handle image updates if any
    if (req.files.length > 0) {
      // Delete old images from S3
      const deleteParams = hotel.images.map((imageUrl) => ({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageUrl.split("/").pop(),
      }));

      const deletePromises = deleteParams.map((param) =>
        s3.send(new DeleteObjectCommand(param))
      );
      await Promise.all(deletePromises);

      // Add new images to S3
      const newImageUrls = req.files.map((file) => file.location);
      hotel.images = newImageUrls;
    }

    await hotel.save();
    res.json(hotel);
  } catch (error) {
    logger.error(`Error updating hotel: ${error.message}`);
    res.status(500).json({ error: "Error updating hotel" });
  }
};

exports.deleteHotel = async (req, res) => {
  const { id } = req.params;

  try {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    if (hotel.owner.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete hotel images from S3
    const deleteParams = hotel.images.map((imageUrl) => ({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: imageUrl.split("/").pop(),
    }));

    const deletePromises = deleteParams.map((param) =>
      s3.send(new DeleteObjectCommand(param))
    );
    await Promise.all(deletePromises);

    await hotel.remove();
    res.json({ msg: "Hotel deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting hotel: ${error.message}`);
    res.status(500).json({ error: "Error deleting hotel" });
  }
};

exports.bulkUpdateHotels = async (req, res) => {
  const { ids, updateData } = req.body;

  try {
    const hotels = await Hotel.find({ _id: { $in: ids } });
    if (!hotels.length) {
      return res.status(404).json({ error: "Hotels not found" });
    }

    const updatedHotels = await Hotel.updateMany(
      { _id: { $in: ids } },
      { $set: updateData },
      { new: true }
    );

    res.json(updatedHotels);
  } catch (error) {
    logger.error(`Error updating hotels: ${error.message}`);
    res.status(500).json({ error: "Error updating hotels" });
  }
};

exports.bulkDeleteHotels = async (req, res) => {
  const { ids } = req.body;

  try {
    const hotels = await Hotel.find({ _id: { $in: ids } });
    if (!hotels.length) {
      return res.status(404).json({ error: "Hotels not found" });
    }

    // Delete images from S3 for each hotel
    const deleteParams = hotels.flatMap((hotel) =>
      hotel.images.map((imageUrl) => ({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageUrl.split("/").pop(),
      }))
    );

    const deletePromises = deleteParams.map((param) =>
      s3.send(new DeleteObjectCommand(param))
    );
    await Promise.all(deletePromises);

    await Hotel.deleteMany({ _id: { $in: ids } });
    res.json({ msg: "Hotels deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting hotels: ${error.message}`);
    res.status(500).json({ error: "Error deleting hotels" });
  }
};
