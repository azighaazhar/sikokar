const { db } = require("../services/db");

const penjualanSelectFields = [
  "id",
  "no",
  "tgl",
  "lokasi_id",
  "jenis",
  "anggota_id",
  "subtotal",
  "diskon_total",
  "ppn_total",
  "total",
  "status",
  "kasir_id",
  "created_at"
];

const listPenjualan = async (req, res) => {
  const { jenis, lokasi_id, kasir_id, anggota_id } = req.query || {};
  const query = db("penjualan").select(penjualanSelectFields).orderBy("created_at", "desc");

  if (jenis) {
    query.where({ jenis });
  }

  if (lokasi_id) {
    query.where({ lokasi_id });
  }

  if (kasir_id) {
    query.where({ kasir_id });
  }

  if (anggota_id) {
    query.where({ anggota_id });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getPenjualanById = async (req, res) => {
  const { id } = req.params || {};
  const header = await db("penjualan").select(penjualanSelectFields).where({ id }).first();

  if (!header) {
    return res.status(404).json({ message: "Penjualan not found" });
  }

  const items = await db("penjualan_item")
    .select([
      "id",
      "penjualan_id",
      "barang_id",
      "nama",
      "qty",
      "harga_beli_at",
      "harga_jual_at",
      "diskon_pct",
      "subtotal"
    ])
    .where({ penjualan_id: id })
    .orderBy("id", "asc");

  return res.json({ data: { ...header, items } });
};

const createPenjualan = async (req, res) => {
  const {
    id,
    no,
    tgl,
    lokasi_id,
    jenis,
    anggota_id,
    subtotal,
    diskon_total,
    ppn_total,
    total,
    status,
    kasir_id,
    items
  } = req.body || {};

  if (!id || !no || !tgl) {
    return res.status(400).json({ message: "id, no, and tgl are required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items is required" });
  }

  const exists = await db("penjualan").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Penjualan id already exists" });
  }

  const noExists = await db("penjualan").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Penjualan no already exists" });
  }

  const payload = {
    id,
    no,
    tgl,
    lokasi_id: lokasi_id || null,
    jenis: jenis || "cash",
    anggota_id: anggota_id || null,
    subtotal: subtotal || 0,
    diskon_total: diskon_total || 0,
    ppn_total: ppn_total || 0,
    total: total || 0,
    status: status || "lunas",
    kasir_id: kasir_id || null
  };

  await db.transaction(async (trx) => {
    await trx("penjualan").insert(payload);

    const itemRows = items.map((item, index) => ({
      id: item.id || `${id}-${index + 1}`,
      penjualan_id: id,
      barang_id: item.barang_id || null,
      nama: item.nama || null,
      qty: item.qty || 1,
      harga_beli_at: item.harga_beli_at || 0,
      harga_jual_at: item.harga_jual_at || 0,
      diskon_pct: item.diskon_pct || 0,
      subtotal: item.subtotal || 0
    }));

    await trx("penjualan_item").insert(itemRows);
  });

  return res.status(201).json({ id: payload.id, no: payload.no, total: payload.total });
};

module.exports = { listPenjualan, getPenjualanById, createPenjualan };
