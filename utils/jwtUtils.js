const jwt = require("jsonwebtoken");

// Create a JWT token (symmetric algorithm - HS256)
const createToken = (payload) => {
  const secretKey = process.env.JWT_SECRET;
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

// Validate a JWT token (symmetric algorithm - HS256)
const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null; // Invalid token
  }
};

// Read a JWT token (symmetric algorithm - HS256)
const readToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null; // Invalid token
  }
};

module.exports = {
  createToken,
  validateToken,
  readToken,
};
