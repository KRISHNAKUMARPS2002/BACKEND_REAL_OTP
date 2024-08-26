const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");

// Route to get all hotels
router.get("/", hotelController.getAllHotels);

// Route to get a single hotel by ID
router.get("/:id", hotelController.getHotelById);

module.exports = router;
