const jwt = require("jsonwebtoken");

const jwtMiddleware = async (req, res, next) => {
  const userService = require('../services/userService');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is missing.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Resolve user ID from email (token only contains email & role)
    const userService = require('../services/userService');
    const user = await userService.getProfile(decoded.email);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    req.payload = user.id; // store numeric user ID for downstream services
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.payload = decoded.email;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = jwtMiddleware;