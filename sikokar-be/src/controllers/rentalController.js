const { db } = require("../services/db");

const rentalSelectFields = [
  "id",
  "no",
  "tgl_mulai",
  "tgl_selesai",
  "aset_id",
  "kategori",
  "tipe_harga",
  "tarif_custom",
  "total",
  "status",
  "tipe_penyewa",
  "nama_penyewa",
  "nama_perusahaan",
  "no_hp",
  "keterangan",
  "created_at"
];

const listRental = async (req, res) => {
  const { status, aset_id } = req.query || {};
  const query = db("rental").select(rentalSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }
  if (aset_id) {
    query.where({ aset_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getRentalById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("rental").select(rentalSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Rental not found" });
  }

  return res.json({ data: row });
};

const createRental = async (req, res) => {
  const {
    id,
    no,
    tgl_mulai,
    tgl_selesai,
    aset_id,
    kategori,
    tipe_harga,
    tarif_custom,
    total,
    status,
    tipe_penyewa,
    nama_penyewa,
    nama_perusahaan,
    no_hp,
    keterangan
  } = req.body || {};

  if (!id || !no || !tgl_mulai) {
    return res.status(400).json({ message: "id, no, and tgl_mulai are required" });
  }

  const exists = await db("rental").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Rental id already exists" });
  }

  const noExists = await db("rental").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Rental no already exists" });
  }

  const payload = {
    id,
    no,
    tgl_mulai,
    tgl_selesai: tgl_selesai || null,
    aset_id: aset_id || null,
    kategori: kategori || null,
    tipe_harga: tipe_harga || "harian",
    tarif_custom: tarif_custom || 0,
    total: total || 0,
    status: status || "aktif",
    tipe_penyewa: tipe_penyewa || null,
    nama_penyewa: nama_penyewa || null,
    nama_perusahaan: nama_perusahaan || null,
    no_hp: no_hp || null,
    keterangan: keterangan || null
  };

  await db("rental").insert(payload);

  return res.status(201).json({ id: payload.id, no: payload.no, status: payload.status });
};

const asetSelectFields = [
  "id",
  "kode",
  "nama",
  "kategori",
  "tarif_harian",
  "tarif_bulanan",
  "kapasitas",
  "nopol",
  "status",
  "created_at"
];

const listRentalAset = async (req, res) => {
  const { status, kategori } = req.query || {};
  const query = db("rental_aset").select(asetSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }
  if (kategori) {
    query.where({ kategori });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getRentalAsetById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("rental_aset").select(asetSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Aset not found" });
  }

  return res.json({ data: row });
};

const createRentalAset = async (req, res) => {
  const { id, kode, nama, kategori, tarif_harian, tarif_bulanan, kapasitas, nopol, status } = req.body || {};

  if (!id || !kode || !nama) {
    return res.status(400).json({ message: "id, kode, and nama are required" });
  }

  const exists = await db("rental_aset").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Aset id already exists" });
  }

  const kodeExists = await db("rental_aset").where({ kode }).first();
  if (kodeExists) {
    return res.status(409).json({ message: "Aset kode already exists" });
  }

  const payload = {
    id,
    kode,
    nama,
    kategori: kategori || null,
    tarif_harian: tarif_harian || 0,
    tarif_bulanan: tarif_bulanan || 0,
    kapasitas: kapasitas || 0,
    nopol: nopol || null,
    status: status || "tersedia"
  };

  await db("rental_aset").insert(payload);

  return res.status(201).json({ id: payload.id, kode: payload.kode, nama: payload.nama });
};

module.exports = { listRental, getRentalById, createRental, listRentalAset, getRentalAsetById, createRentalAset };
