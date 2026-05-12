const { db } = require("../services/db");

const stokSelectFields = [
  "id",
  "barang_id",
  "lokasi_id",
  "jumlah",
  "updated_at"
];

const listStok = async (req, res) => {
  const { barang_id, lokasi_id } = req.query || {};
  const query = db("stok").select(stokSelectFields).orderBy("updated_at", "desc");

  if (barang_id) {
    query.where({ barang_id });
  }

  if (lokasi_id) {
    query.where({ lokasi_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getStokById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("stok").select(stokSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Stok not found" });
  }

  return res.json({ data: row });
};

const createStok = async (req, res) => {
  const { id, barang_id, lokasi_id, jumlah } = req.body || {};

  if (!id || !barang_id || !lokasi_id) {
    return res.status(400).json({ message: "id, barang_id, and lokasi_id are required" });
  }

  const exists = await db("stok").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Stok id already exists" });
  }

  const duplicate = await db("stok").where({ barang_id, lokasi_id }).first();
  if (duplicate) {
    return res.status(409).json({ message: "Stok for barang and lokasi already exists" });
  }

  const payload = {
    id,
    barang_id,
    lokasi_id,
    jumlah: jumlah || 0
  };

  await db("stok").insert(payload);

  return res.status(201).json({ id: payload.id, barang_id: payload.barang_id, lokasi_id: payload.lokasi_id });
};

module.exports = { listStok, getStokById, createStok };
