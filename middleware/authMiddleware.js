const jwt = require("jsonwebtoken");
const logger = require("../logger"); // Adjust the path to your actual logger file

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      logger.warn("Access denied. No token provided.");
      return res
        .status(403)
        .json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'
    if (!token) {
      logger.warn("Access denied. No token provided.");
      return res
        .status(403)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Invalid token.", error);
    res.status(400).json({ error: "Invalid token." });
  }
};
