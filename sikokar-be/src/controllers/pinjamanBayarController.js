const { db } = require("../services/db");

const pinjamanBayarSelectFields = [
  "id",
  "pinjaman_id",
  "tgl",
  "nominal_total",
  "bayar_pokok",
  "bayar_bunga",
  "cicilan_ke",
  "metode",
  "user_id"
];

const listPinjamanBayar = async (req, res) => {
  const { pinjaman_id } = req.query || {};
  const query = db("pinjaman_bayar").select(pinjamanBayarSelectFields).orderBy("tgl", "desc");

  if (pinjaman_id) {
    query.where({ pinjaman_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getPinjamanBayarById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("pinjaman_bayar").select(pinjamanBayarSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Pinjaman bayar not found" });
  }

  return res.json({ data: row });
};

const createPinjamanBayar = async (req, res) => {
  const {
    id,
    pinjaman_id,
    tgl,
    nominal_total,
    bayar_pokok,
    bayar_bunga,
    cicilan_ke,
    metode,
    user_id
  } = req.body || {};

  if (!id || !pinjaman_id || !tgl) {
    return res.status(400).json({ message: "id, pinjaman_id, and tgl are required" });
  }

  const exists = await db("pinjaman_bayar").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Pinjaman bayar id already exists" });
  }

  const payload = {
    id,
    pinjaman_id,
    tgl,
    nominal_total: nominal_total || 0,
    bayar_pokok: bayar_pokok || 0,
    bayar_bunga: bayar_bunga || 0,
    cicilan_ke: cicilan_ke || null,
    metode: metode || "potong-gaji",
    user_id: user_id || null
  };

  await db("pinjaman_bayar").insert(payload);

  return res.status(201).json({ id: payload.id, pinjaman_id: payload.pinjaman_id, nominal_total: payload.nominal_total });
};

module.exports = { listPinjamanBayar, getPinjamanBayarById, createPinjamanBayar };
