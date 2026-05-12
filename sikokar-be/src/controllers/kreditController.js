const { db } = require("../services/db");

const kreditSelectFields = [
  "id",
  "no",
  "anggota_id",
  "jenis",
  "nama_barang",
  "toko",
  "tgl_mulai",
  "harga_beli",
  "dp",
  "pokok",
  "bunga_pct",
  "tenor",
  "angsuran_per_bulan",
  "sisa",
  "status",
  "catatan",
  "created_at"
];

const listKredit = async (req, res) => {
  const { status, jenis, anggota_id } = req.query || {};
  const query = db("kredit").select(kreditSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }
  if (jenis) {
    query.where({ jenis });
  }
  if (anggota_id) {
    query.where({ anggota_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getKreditById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("kredit").select(kreditSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Kredit not found" });
  }

  const pembayaran = await db("kredit_bayar")
    .select(["id", "kredit_id", "tgl", "nominal", "metode", "user_id"])
    .where({ kredit_id: id })
    .orderBy("tgl", "asc");

  return res.json({ data: { ...row, pembayaran } });
};

const createKredit = async (req, res) => {
  const {
    id,
    no,
    anggota_id,
    jenis,
    nama_barang,
    toko,
    tgl_mulai,
    harga_beli,
    dp,
    pokok,
    bunga_pct,
    tenor,
    angsuran_per_bulan,
    sisa,
    status,
    catatan
  } = req.body || {};

  if (!id || !no || !anggota_id) {
    return res.status(400).json({ message: "id, no, and anggota_id are required" });
  }

  const exists = await db("kredit").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Kredit id already exists" });
  }

  const noExists = await db("kredit").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Kredit no already exists" });
  }

  const payload = {
    id,
    no,
    anggota_id,
    jenis: jenis || "motor",
    nama_barang: nama_barang || null,
    toko: toko || null,
    tgl_mulai: tgl_mulai || null,
    harga_beli: harga_beli || 0,
    dp: dp || 0,
    pokok: pokok || 0,
    bunga_pct: bunga_pct || 0,
    tenor: tenor || 0,
    angsuran_per_bulan: angsuran_per_bulan || 0,
    sisa: sisa || 0,
    status: status || "aktif",
    catatan: catatan || null
  };

  await db("kredit").insert(payload);

  return res.status(201).json({ id: payload.id, no: payload.no, status: payload.status });
};

const createKreditBayar = async (req, res) => {
  const { id, kredit_id, tgl, nominal, metode, user_id } = req.body || {};

  if (!id || !kredit_id || !tgl) {
    return res.status(400).json({ message: "id, kredit_id, and tgl are required" });
  }

  const exists = await db("kredit_bayar").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Kredit bayar id already exists" });
  }

  const payload = {
    id,
    kredit_id,
    tgl,
    nominal: nominal || 0,
    metode: metode || "tunai",
    user_id: user_id || null
  };

  await db("kredit_bayar").insert(payload);

  return res.status(201).json({ id: payload.id, kredit_id: payload.kredit_id });
};

module.exports = { listKredit, getKreditById, createKredit, createKreditBayar };
