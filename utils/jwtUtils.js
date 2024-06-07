const jwt = require("jsonwebtoken");
const logger = require("../logger"); // Adjust the path to your actual logger file

const createTokens = (
  payload,
  accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRY || "7d",
  algorithm = process.env.JWT_ALGORITHM || "HS256"
) => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    logger.error("JWT secret key is not defined in environment variables.");
    throw new Error("JWT secret key is not defined.");
  }
  try {
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
    throw error;
  }
};

const validateToken = (token) => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    logger.error("JWT secret key is not defined in environment variables.");
    throw new Error("JWT secret key is not defined.");
  }
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    logger.error("Error validating JWT token:", error);
    throw error;
  }
};

const readToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error("Error reading JWT token:", error);
    throw error;
  }
};

module.exports = {
  createTokens,
  validateToken,
  readToken,
};
