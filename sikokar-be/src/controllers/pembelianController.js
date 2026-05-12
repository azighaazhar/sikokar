const { db } = require("../services/db");

const pembelianSelectFields = [
  "id",
  "no",
  "tgl",
  "supplier_id",
  "lokasi_id",
  "status",
  "catatan",
  "total",
  "created_at"
];

const listPembelian = async (req, res) => {
  const { no, tgl_from, tgl_to, supplier_id, lokasi_id, status } = req.query || {};
  const query = db("pembelian").select(pembelianSelectFields).orderBy("created_at", "desc");

  if (no) {
    query.where("no", "like", `%${no}%`);
  }
  if (supplier_id) {
    query.where({ supplier_id });
  }
  if (lokasi_id) {
    query.where({ lokasi_id });
  }
  if (status) {
    query.where({ status });
  }
  if (tgl_from && tgl_to) {
    query.whereBetween("tgl", [tgl_from, tgl_to]);
  } else if (tgl_from) {
    query.where("tgl", ">=", tgl_from);
  } else if (tgl_to) {
    query.where("tgl", "<=", tgl_to);
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getPembelianById = async (req, res) => {
  const { id } = req.params || {};
  const header = await db("pembelian").select(pembelianSelectFields).where({ id }).first();

  if (!header) {
    return res.status(404).json({ message: "Pembelian not found" });
  }

  const items = await db("pembelian_item")
    .select([
      "id",
      "pembelian_id",
      "barang_id",
      "nama",
      "qty",
      "harga_beli",
      "subtotal"
    ])
    .where({ pembelian_id: id })
    .orderBy("id", "asc");

  return res.json({ data: { ...header, items } });
};

const createPembelian = async (req, res) => {
  const {
    id,
    no,
    tgl,
    supplier_id,
    lokasi_id,
    status,
    catatan,
    total,
    items
  } = req.body || {};

  if (!id || !no || !tgl) {
    return res.status(400).json({ message: "id, no, and tgl are required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items is required" });
  }

  const exists = await db("pembelian").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Pembelian id already exists" });
  }

  const noExists = await db("pembelian").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Pembelian no already exists" });
  }

  const payload = {
    id,
    no,
    tgl,
    supplier_id: supplier_id || null,
    lokasi_id: lokasi_id || null,
    status: status || "lunas",
    catatan: catatan || null,
    total: total || 0
  };

  await db.transaction(async (trx) => {
    await trx("pembelian").insert(payload);

    const itemRows = items.map((item, index) => ({
      id: item.id || `${id}-${index + 1}`,
      pembelian_id: id,
      barang_id: item.barang_id || null,
      nama: item.nama || null,
      qty: item.qty || 1,
      harga_beli: item.harga_beli || 0,
      subtotal: item.subtotal || 0
    }));

    await trx("pembelian_item").insert(itemRows);
  });

  return res.status(201).json({ id: payload.id, no: payload.no, total: payload.total });
};

module.exports = { listPembelian, getPembelianById, createPembelian };
