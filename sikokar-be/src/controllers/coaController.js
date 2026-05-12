const { db } = require("../services/db");

const coaSelectFields = [
  "id",
  "kode",
  "nama",
  "tipe",
  "level",
  "parent_id",
  "aktif"
];

const listCoa = async (req, res) => {
  const { tipe, aktif, parent_id } = req.query || {};
  const query = db("coa").select(coaSelectFields).orderBy("kode", "asc");

  if (tipe) {
    query.where({ tipe });
  }

  if (aktif !== undefined) {
    query.where({ aktif: Number(aktif) });
  }

  if (parent_id) {
    query.where({ parent_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getCoaById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("coa").select(coaSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "COA not found" });
  }

  return res.json({ data: row });
};

const createCoa = async (req, res) => {
  const { id, kode, nama, tipe, level, parent_id, aktif } = req.body || {};

  if (!id || !kode || !nama || !tipe) {
    return res.status(400).json({ message: "id, kode, nama, and tipe are required" });
  }

  const exists = await db("coa").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "COA id already exists" });
  }

  const kodeExists = await db("coa").where({ kode }).first();
  if (kodeExists) {
    return res.status(409).json({ message: "COA kode already exists" });
  }

  const payload = {
    id,
    kode,
    nama,
    tipe,
    level: level || 1,
    parent_id: parent_id || null,
    aktif: aktif === undefined ? 1 : aktif
  };

  await db("coa").insert(payload);

  return res.status(201).json({ id: payload.id, kode: payload.kode, nama: payload.nama });
};

module.exports = { listCoa, getCoaById, createCoa };
