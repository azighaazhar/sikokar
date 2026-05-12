const { db } = require("../services/db");

const lokasiSelectFields = [
  "id",
  "kode",
  "nama",
  "aktif"
];

const listLokasi = async (req, res) => {
  const { q, aktif } = req.query || {};
  const query = db("lokasi").select(lokasiSelectFields).orderBy("nama", "asc");

  if (aktif !== undefined) {
    query.where({ aktif: Number(aktif) });
  }

  if (q) {
    query.andWhere((builder) => {
      builder.where("nama", "like", `%${q}%`).orWhere("kode", "like", `%${q}%`);
    });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getLokasiById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("lokasi").select(lokasiSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Lokasi not found" });
  }

  return res.json({ data: row });
};

const createLokasi = async (req, res) => {
  const { id, kode, nama, aktif } = req.body || {};

  if (!id || !nama) {
    return res.status(400).json({ message: "id and nama are required" });
  }

  const exists = await db("lokasi").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Lokasi id already exists" });
  }

  if (kode) {
    const kodeExists = await db("lokasi").where({ kode }).first();
    if (kodeExists) {
      return res.status(409).json({ message: "Lokasi kode already exists" });
    }
  }

  const payload = {
    id,
    kode: kode || null,
    nama,
    aktif: aktif === undefined ? 1 : aktif
  };

  await db("lokasi").insert(payload);

  return res.status(201).json({ id: payload.id, kode: payload.kode, nama: payload.nama });
};

module.exports = { listLokasi, getLokasiById, createLokasi };
