const { db } = require("../services/db");

const trxSelectFields = [
  "id",
  "anggota_id",
  "jenis",
  "tipe",
  "tgl",
  "nominal",
  "metode",
  "keterangan",
  "created_at"
];

const listSimpananTransaksi = async (req, res) => {
  const { anggota_id, jenis, tipe, tgl_from, tgl_to } = req.query || {};
  const query = db("simpanan_transaksi").select(trxSelectFields).orderBy("created_at", "desc");

  if (anggota_id) {
    query.where({ anggota_id });
  }
  if (jenis) {
    query.where({ jenis });
  }
  if (tipe) {
    query.where({ tipe });
  }
  if (tgl_from && tgl_to) {
    query.whereBetween("tgl", [tgl_from, tgl_to]);
  }

  const rows = await query;
  return res.json({ data: rows });
};

const createSimpananTransaksi = async (req, res) => {
  const { id, anggota_id, jenis, tipe, tgl, nominal, metode, keterangan } = req.body || {};

  if (!id || !anggota_id || !jenis || !tipe) {
    return res.status(400).json({ message: "id, anggota_id, jenis, and tipe are required" });
  }

  const exists = await db("simpanan_transaksi").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Simpanan transaksi id already exists" });
  }

  const payload = {
    id,
    anggota_id,
    jenis,
    tipe,
    tgl: tgl || null,
    nominal: nominal || 0,
    metode: metode || "tunai",
    keterangan: keterangan || null
  };

  await db("simpanan_transaksi").insert(payload);

  return res.status(201).json({ id: payload.id, anggota_id: payload.anggota_id });
};

module.exports = { listSimpananTransaksi, createSimpananTransaksi };
