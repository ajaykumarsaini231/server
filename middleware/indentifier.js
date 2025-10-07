const jwt = require("jsonwebtoken");

exports.identifier = (req, res, next) => {
  try {
    let token;

    // Case 1: API requests (e.g. React frontend) → send via Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Case 2: Browser (if token is in cookies)
    else if (req.cookies && req.cookies.Authorization) {
      // Cookie can be stored as "Bearer <token>" or just "<token>"
      const cookieToken = req.cookies.Authorization;
      token = cookieToken.startsWith("Bearer ")
        ? cookieToken.split(" ")[1]
        : cookieToken;
    }

    if (!token) {
      return res.status(403).json({ success: false, message: "Unauthorized — Token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.Secret_Token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({ success: false, message: "Token verification failed" });
  }
};
