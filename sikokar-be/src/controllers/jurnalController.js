const { db } = require("../services/db");

const jurnalSelectFields = [
  "id",
  "no",
  "tgl",
  "modul",
  "ref_id",
  "ket",
  "user_id",
  "created_at"
];

const listJurnal = async (req, res) => {
  const { modul, user_id, tgl } = req.query || {};
  const query = db("jurnal").select(jurnalSelectFields).orderBy("tgl", "desc");

  if (modul) {
    query.where({ modul });
  }

  if (user_id) {
    query.where({ user_id });
  }

  if (tgl) {
    query.where({ tgl });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getJurnalById = async (req, res) => {
  const { id } = req.params || {};
  const header = await db("jurnal").select(jurnalSelectFields).where({ id }).first();

  if (!header) {
    return res.status(404).json({ message: "Jurnal not found" });
  }

  const details = await db("jurnal_detail")
    .select([
      "id",
      "jurnal_id",
      "coa_id",
      "debit",
      "kredit"
    ])
    .where({ jurnal_id: id })
    .orderBy("id", "asc");

  return res.json({ data: { ...header, details } });
};

const createJurnal = async (req, res) => {
  const { id, no, tgl, modul, ref_id, ket, user_id, details } = req.body || {};

  if (!id || !no || !tgl) {
    return res.status(400).json({ message: "id, no, and tgl are required" });
  }

  if (!Array.isArray(details) || details.length === 0) {
    return res.status(400).json({ message: "details is required" });
  }

  const exists = await db("jurnal").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Jurnal id already exists" });
  }

  const noExists = await db("jurnal").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Jurnal no already exists" });
  }

  const payload = {
    id,
    no,
    tgl,
    modul: modul || null,
    ref_id: ref_id || null,
    ket: ket || null,
    user_id: user_id || null
  };

  await db.transaction(async (trx) => {
    await trx("jurnal").insert(payload);

    const detailRows = details.map((detail, index) => ({
      id: detail.id || `${id}-${index + 1}`,
      jurnal_id: id,
      coa_id: detail.coa_id,
      debit: detail.debit || 0,
      kredit: detail.kredit || 0
    }));

    await trx("jurnal_detail").insert(detailRows);
  });

  return res.status(201).json({ id: payload.id, no: payload.no });
};

module.exports = { listJurnal, getJurnalById, createJurnal };
