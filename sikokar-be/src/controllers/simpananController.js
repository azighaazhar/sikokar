const { db } = require("../services/db");

const simpananSelectFields = [
  "id",
  "anggota_id",
  "jenis",
  "saldo",
  "updated_at"
];

const listSimpanan = async (req, res) => {
  const { anggota_id, jenis } = req.query || {};
  const query = db("simpanan").select(simpananSelectFields).orderBy("updated_at", "desc");

  if (anggota_id) {
    query.where({ anggota_id });
  }

  if (jenis) {
    query.where({ jenis });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getSimpananById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("simpanan").select(simpananSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Simpanan not found" });
  }

  return res.json({ data: row });
};

const createSimpanan = async (req, res) => {
  const { id, anggota_id, jenis, saldo } = req.body || {};

  if (!id || !anggota_id || !jenis) {
    return res.status(400).json({ message: "id, anggota_id, and jenis are required" });
  }

  const exists = await db("simpanan").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Simpanan id already exists" });
  }

  const duplicate = await db("simpanan").where({ anggota_id, jenis }).first();
  if (duplicate) {
    return res.status(409).json({ message: "Simpanan for anggota and jenis already exists" });
  }

  const payload = {
    id,
    anggota_id,
    jenis,
    saldo: saldo || 0
  };

  await db("simpanan").insert(payload);

  return res.status(201).json({ id: payload.id, anggota_id: payload.anggota_id, jenis: payload.jenis, saldo: payload.saldo });
};

module.exports = { listSimpanan, getSimpananById, createSimpanan };
