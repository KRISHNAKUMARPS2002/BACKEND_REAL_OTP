const jwt = require("jsonwebtoken");
const logger = require("../logger"); // Adjust the path to your actual logger file

const createTokens = (
  payload,
  accessTokenExpiresIn = "1h",
  refreshTokenExpiresIn = "7d",
  algorithm = "HS256"
) => {
  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error(
        "JWT secret key is not defined in environment variables."
      );
    }
    const accessToken = jwt.sign(payload, secretKey, {
      expiresIn: accessTokenExpiresIn,
      algorithm,
    });
    const refreshToken = jwt.sign(payload, secretKey, {
      expiresIn: refreshTokenExpiresIn,
      algorithm,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Error creating JWT tokens:", error);
    return null;
  }
};

const validateToken = (token) => {
  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error(
        "JWT secret key is not defined in environment variables."
      );
    }
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    logger.error("Error validating JWT token:", error);
    return null;
  }
};

const readToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    logger.error("Error reading JWT token:", error);
    return null;
  }
};

module.exports = {
  createTokens,
  validateToken,
  readToken,
};
