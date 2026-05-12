const bcrypt = require("bcryptjs");
const { db } = require("../services/db");

const allowedRoles = ["admin", "pengurus", "kasir", "accounting", "simpin"];
const userSelectFields = ["id", "username", "name", "role", "nip", "lokasi_id", "aktif", "created_at", "updated_at"];

const createUser = async (req, res) => {
  const { username, password, name, role, nip, lokasi_id } = req.body || {};

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Username, password, and role are required" });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const exists = await db("users").where({ username }).first();
  if (exists) {
    return res.status(409).json({ message: "Username already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    id: `U${Date.now()}`,
    username,
    password: hashed,
    name: name || username,
    role,
    nip: nip || null,
    lokasi_id: lokasi_id || null,
    aktif: 1
  };

  await db("users").insert(user);

  return res.status(201).json({ id: user.id, username: user.username, role: user.role, name: user.name });
};

const listUsers = async (req, res) => {
  const { role } = req.query || {};
  const query = db("users").select(userSelectFields).orderBy("created_at", "desc");

  if (role) {
    query.where({ role });
  }

  const users = await query;
  return res.json({ data: users });
};

const getUserById = async (req, res) => {
  const { id } = req.params || {};
  const user = await db("users").select(userSelectFields).where({ id }).first();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ data: user });
};

module.exports = { createUser, listUsers, getUserById };
