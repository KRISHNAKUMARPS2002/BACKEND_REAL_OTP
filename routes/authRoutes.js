// authRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

// User login
router.post("/auth/login", login);

module.exports = router;
