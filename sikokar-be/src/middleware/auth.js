const jwt = require("jsonwebtoken");

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }
    const payload = jwt.verify(token, secret, {
      maxAge: process.env.JWT_EXPIRES_IN || "1d"
    });
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Token expired" });
    }
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const requireRole = (roles) => (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (!userRole || !roles.includes(userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

module.exports = { requireAuth, requireRole };
