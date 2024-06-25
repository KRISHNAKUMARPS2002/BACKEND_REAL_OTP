const jwt = require("jsonwebtoken");
const logger = require("../logger");

const accessDeniedMessage = "Access denied. No token provided.";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      logger.warn(accessDeniedMessage);
      return res.status(401).json({ error: accessDeniedMessage });
    }

    const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'
    if (!token) {
      logger.warn(accessDeniedMessage);
      return res.status(401).json({ error: accessDeniedMessage });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info("Decoded token:", decoded); // Log the decoded token for debugging
    req.user = decoded; // Attach the decoded token to req.user

    // Check if the user has an admin role
    if (req.user.role !== "admin") {
      logger.warn("Access denied. Admins only.");
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    logger.error("Invalid token.", error);
    res.status(400).json({ error: "Invalid token." });
  }
};
