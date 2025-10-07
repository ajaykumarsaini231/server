const jwt = require("jsonwebtoken");
const { AppError } = require("../utills/errorHandler");

exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized, no token", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 👈 decoded में id/email होगी
    next();
  } catch (error) {
    throw new AppError("Not authorized, token failed", 401);
  }
};
