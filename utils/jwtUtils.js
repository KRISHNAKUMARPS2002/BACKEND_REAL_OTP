const jwt = require("jsonwebtoken");

const createToken = (payload, expiresIn = "1h", algorithm = "HS256") => {
  try {
    const secretKey = process.env.JWT_SECRET;
    return jwt.sign(payload, secretKey, { expiresIn, algorithm });
  } catch (error) {
    console.error("Error creating JWT token:", error);
    return null;
  }
};

const validateToken = (token) => {
  try {
    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    console.error("Error validating JWT token:", error);
    return null;
  }
};

const readToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error("Error reading JWT token:", error);
    return null;
  }
};

module.exports = {
  createToken,
  validateToken,
  readToken,
};
