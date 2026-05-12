const { db } = require("../services/db");

const healthCheck = (req, res) => res.json({ status: "ok" });

const healthCheckDb = async (req, res) => {
  try {
    await db.raw("SELECT 1");
    return res.json({ status: "ok", db: "ok" });
  } catch (error) {
    return res.status(500).json({ status: "error", db: "error", message: error.message });
  }
};

module.exports = { healthCheck, healthCheckDb };
