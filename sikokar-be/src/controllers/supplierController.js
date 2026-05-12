const { db } = require("../services/db");

const supplierSelectFields = [
  "id",
  "kode",
  "nama",
  "jenis",
  "is_pkp",
  "npwp",
  "alamat",
  "telp",
  "aktif",
  "created_at"
];

const listSupplier = async (req, res) => {
  const { q, jenis, aktif } = req.query || {};
  const query = db("supplier").select(supplierSelectFields).orderBy("created_at", "desc");

  if (jenis) {
    query.where({ jenis });
  }

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

const getSupplierById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("supplier").select(supplierSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  return res.json({ data: row });
};

const createSupplier = async (req, res) => {
  const { id, kode, nama, jenis, is_pkp, npwp, alamat, telp, aktif } = req.body || {};

  if (!id || !nama) {
    return res.status(400).json({ message: "id and nama are required" });
  }

  const exists = await db("supplier").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Supplier id already exists" });
  }

  if (kode) {
    const kodeExists = await db("supplier").where({ kode }).first();
    if (kodeExists) {
      return res.status(409).json({ message: "Supplier kode already exists" });
    }
  }

  const payload = {
    id,
    kode: kode || null,
    nama,
    jenis: jenis || "regular",
    is_pkp: is_pkp ? 1 : 0,
    npwp: npwp || null,
    alamat: alamat || null,
    telp: telp || null,
    aktif: aktif === undefined ? 1 : aktif
  };

  await db("supplier").insert(payload);

  return res.status(201).json({ id: payload.id, kode: payload.kode, nama: payload.nama });
};

const updateSupplier = async (req, res) => {
  const { id } = req.params || {};
  const { kode, nama, jenis, is_pkp, npwp, alamat, telp, aktif } = req.body || {};

  const row = await db("supplier").where({ id }).first();
  if (!row) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  if (kode !== undefined && kode !== null && String(kode) !== String(row.kode || "")) {
    const kodeExists = await db("supplier").where({ kode }).whereNot({ id }).first();
    if (kodeExists) {
      return res.status(409).json({ message: "Supplier kode already exists" });
    }
  }

  const payload = {
    kode: kode !== undefined ? kode || null : row.kode,
    nama: nama !== undefined ? nama : row.nama,
    jenis: jenis !== undefined ? jenis || "regular" : row.jenis,
    is_pkp: is_pkp === undefined ? row.is_pkp : is_pkp ? 1 : 0,
    npwp: npwp !== undefined ? npwp || null : row.npwp,
    alamat: alamat !== undefined ? alamat || null : row.alamat,
    telp: telp !== undefined ? telp || null : row.telp,
    aktif: aktif === undefined ? row.aktif : Number(aktif)
  };

  await db("supplier").where({ id }).update(payload);

  return res.json({ id, kode: payload.kode, nama: payload.nama });
};

module.exports = { listSupplier, getSupplierById, createSupplier, updateSupplier };
