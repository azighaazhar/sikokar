const { db } = require("../services/db");

const kolektifSelectFields = ["id", "periode", "status", "created_at"];

const listKolektif = async (req, res) => {
  const { status, periode } = req.query || {};
  const query = db("kolektif_potong_gaji").select(kolektifSelectFields).orderBy("created_at", "desc");

  if (status) {
    query.where({ status });
  }
  if (periode) {
    query.where({ periode });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getKolektifById = async (req, res) => {
  const { id } = req.params || {};
  const header = await db("kolektif_potong_gaji").select(kolektifSelectFields).where({ id }).first();

  if (!header) {
    return res.status(404).json({ message: "Kolektif not found" });
  }

  const detail = await db("kolektif_potong_gaji_detail")
    .select(["id", "kolektif_id", "anggota_id", "jenis", "nominal", "status"])
    .where({ kolektif_id: id })
    .orderBy("id", "asc");

  return res.json({ data: { ...header, detail } });
};

const createKolektif = async (req, res) => {
  const { id, periode, status, detail } = req.body || {};

  if (!id || !periode) {
    return res.status(400).json({ message: "id and periode are required" });
  }

  const exists = await db("kolektif_potong_gaji").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Kolektif id already exists" });
  }

  const payload = {
    id,
    periode,
    status: status || "draft"
  };

  await db.transaction(async (trx) => {
    await trx("kolektif_potong_gaji").insert(payload);

    if (Array.isArray(detail) && detail.length > 0) {
      const rows = detail.map((row, index) => ({
        id: row.id || `${id}-${index + 1}`,
        kolektif_id: id,
        anggota_id: row.anggota_id || null,
        jenis: row.jenis || null,
        nominal: row.nominal || 0,
        status: row.status || "pending"
      }));
      await trx("kolektif_potong_gaji_detail").insert(rows);
    }
  });

  return res.status(201).json({ id: payload.id, status: payload.status });
};

module.exports = { listKolektif, getKolektifById, createKolektif };
