const { db } = require("../services/db");

const pinjamanSelectFields = [
  "id",
  "no",
  "anggota_id",
  "jenis",
  "nominal_pengajuan",
  "nominal_disetujui",
  "tenor",
  "bunga_pct",
  "angsuran_per_bulan",
  "sisa_pokok",
  "status",
  "tgl_pengajuan",
  "tgl_cair",
  "user_id",
  "created_at"
];

const listPinjaman = async (req, res) => {
  const { status, anggota_id, user_id } = req.query || {};
  const query = db("pinjaman").select(pinjamanSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }

  if (anggota_id) {
    query.where({ anggota_id });
  }

  if (user_id) {
    query.where({ user_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getPinjamanById = async (req, res) => {
  const { id } = req.params || {};
  const header = await db("pinjaman").select(pinjamanSelectFields).where({ id }).first();

  if (!header) {
    return res.status(404).json({ message: "Pinjaman not found" });
  }

  const pembayaran = await db("pinjaman_bayar")
    .select([
      "id",
      "pinjaman_id",
      "tgl",
      "nominal_total",
      "bayar_pokok",
      "bayar_bunga",
      "cicilan_ke",
      "metode",
      "user_id"
    ])
    .where({ pinjaman_id: id })
    .orderBy("tgl", "asc");

  return res.json({ data: { ...header, pembayaran } });
};

const createPinjaman = async (req, res) => {
  const {
    id,
    no,
    anggota_id,
    jenis,
    nominal_pengajuan,
    nominal_disetujui,
    tenor,
    bunga_pct,
    angsuran_per_bulan,
    sisa_pokok,
    status,
    tgl_pengajuan,
    tgl_cair,
    user_id
  } = req.body || {};

  if (!id || !no || !anggota_id) {
    return res.status(400).json({ message: "id, no, and anggota_id are required" });
  }

  const exists = await db("pinjaman").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Pinjaman id already exists" });
  }

  const noExists = await db("pinjaman").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Pinjaman no already exists" });
  }

  const payload = {
    id,
    no,
    anggota_id,
    jenis: jenis || "regular",
    nominal_pengajuan: nominal_pengajuan || 0,
    nominal_disetujui: nominal_disetujui || 0,
    tenor: tenor || 12,
    bunga_pct: bunga_pct || 1.5,
    angsuran_per_bulan: angsuran_per_bulan || 0,
    sisa_pokok: sisa_pokok || 0,
    status: status || "pending",
    tgl_pengajuan: tgl_pengajuan || null,
    tgl_cair: tgl_cair || null,
    user_id: user_id || null
  };

  await db("pinjaman").insert(payload);

  return res.status(201).json({ id: payload.id, no: payload.no, status: payload.status });
};

module.exports = { listPinjaman, getPinjamanById, createPinjaman };
