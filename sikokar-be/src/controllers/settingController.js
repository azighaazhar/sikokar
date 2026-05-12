const { db } = require("../services/db");

const settingSelectFields = ["key", "value", "label"];

const listSetting = async (req, res) => {
  const { q } = req.query || {};
  const query = db("setting").select(settingSelectFields).orderBy("key", "asc");

  if (q) {
    query.andWhere((builder) => {
      builder.where("key", "like", `%${q}%`).orWhere("label", "like", `%${q}%`);
    });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getSettingByKey = async (req, res) => {
  const { key } = req.params || {};
  const row = await db("setting").select(settingSelectFields).where({ key }).first();

  if (!row) {
    return res.status(404).json({ message: "Setting not found" });
  }

  return res.json({ data: row });
};

const upsertSetting = async (req, res) => {
  const { key } = req.params || {};
  const { value, label } = req.body || {};

  if (!key) {
    return res.status(400).json({ message: "key is required" });
  }

  const exists = await db("setting").where({ key }).first();
  if (exists) {
    await db("setting").where({ key }).update({ value: value || null, label: label || null });
    return res.json({ key, value: value || null, label: label || null });
  }

  const payload = { key, value: value || null, label: label || null };
  await db("setting").insert(payload);
  return res.status(201).json(payload);
};

module.exports = { listSetting, getSettingByKey, upsertSetting };
