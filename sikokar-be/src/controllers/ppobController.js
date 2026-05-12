const { db } = require("../services/db");

const ppobSelectFields = ["id", "anggota_id", "produk", "nominal", "status", "tgl"];

const listPpob = async (req, res) => {
  const { status, anggota_id } = req.query || {};
  const query = db("ppob_transaksi").select(ppobSelectFields).orderBy("tgl", "desc");

  if (status) {
    query.where({ status });
  }
  if (anggota_id) {
    query.where({ anggota_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const createPpob = async (req, res) => {
  const { id, anggota_id, produk, nominal, status } = req.body || {};

  if (!id || !produk) {
    return res.status(400).json({ message: "id and produk are required" });
  }

  const exists = await db("ppob_transaksi").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "PPOB id already exists" });
  }

  const payload = {
    id,
    anggota_id: anggota_id || null,
    produk,
    nominal: nominal || 0,
    status: status || "pending"
  };

  await db("ppob_transaksi").insert(payload);

  return res.status(201).json({ id: payload.id, status: payload.status });
};

module.exports = { listPpob, createPpob };
