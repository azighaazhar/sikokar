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

  const nominalValue = Number(nominal || 0);
  if (nominalValue <= 0) {
    return res.status(400).json({ message: "nominal must be greater than 0" });
  }

  await db.transaction(async (trx) => {
    const exists = await trx("simpanan_transaksi").where({ id }).first();
    if (exists) {
      const error = new Error("Simpanan transaksi id already exists");
      error.status = 409;
      throw error;
    }

    const payload = {
      id,
      anggota_id,
      jenis,
      tipe,
      tgl: tgl || null,
      nominal: nominalValue,
      metode: metode || "tunai",
      keterangan: keterangan || null
    };

    await trx("simpanan_transaksi").insert(payload);

    const simpananRow = await trx("simpanan").where({ anggota_id, jenis }).first();
    const delta = tipe === "penarikan" ? -nominalValue : nominalValue;

    if (simpananRow) {
      const nextSaldo = Number(simpananRow.saldo || 0) + delta;
      if (nextSaldo < 0) {
        const error = new Error("Saldo simpanan tidak mencukupi");
        error.status = 400;
        throw error;
      }
      await trx("simpanan").where({ id: simpananRow.id }).update({ saldo: nextSaldo });
    } else {
      if (delta < 0) {
        const error = new Error("Saldo simpanan tidak mencukupi");
        error.status = 400;
        throw error;
      }
      await trx("simpanan").insert({
        id: `S${Date.now()}`,
        anggota_id,
        jenis,
        saldo: delta,
      });
    }
  });

  return res.status(201).json({ id, anggota_id });
};

module.exports = { listSimpananTransaksi, createSimpananTransaksi };
