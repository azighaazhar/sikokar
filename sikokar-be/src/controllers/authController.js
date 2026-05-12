const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../services/db");

const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = await db("users").where({ username }).first();
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const stored = user.password || "";
  const isHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
  const passwordOk = isHashed ? await bcrypt.compare(password, stored) : password === stored;

  if (!passwordOk) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

  return res.json({ token, user: payload });
};

module.exports = { login };
