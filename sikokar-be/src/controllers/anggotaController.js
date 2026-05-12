const { db } = require("../services/db");

const anggotaSelectFields = [
  "id",
  "no",
  "nip",
  "nama",
  "nik",
  "dept",
  "jabatan",
  "no_hp",
  "gaji",
  "limit_kredit",
  "limit_pinjaman",
  "limit_darurat",
  "max_loans",
  "status",
  "tgl_masuk",
  "created_at",
  "updated_at"
];

const listAnggota = async (req, res) => {
  const { q, status } = req.query || {};
  const query = db("anggota").select(anggotaSelectFields).orderBy("created_at", "desc");

  if (status !== undefined) {
    query.where({ status: Number(status) });
  }

  if (q) {
    query.andWhere((builder) => {
      builder
        .where("nama", "like", `%${q}%`)
        .orWhere("no", "like", `%${q}%`)
        .orWhere("nip", "like", `%${q}%`)
        .orWhere("nik", "like", `%${q}%`)
        .orWhere("id", "like", `%${q}%`);
    });
  }

  const rows = await query;
  return res.json({ data: rows });
};

const getAnggotaById = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("anggota").select(anggotaSelectFields).where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Anggota not found" });
  }

  return res.json({ data: row });
};

const deleteAnggota = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("anggota").where({ id }).first();

  if (!row) {
    return res.status(404).json({ message: "Anggota not found" });
  }

  await db("anggota").where({ id }).del();

  return res.status(200).json({ id });
};

const updateAnggota = async (req, res) => {
  const { id } = req.params || {};
  const payload = req.body || {};

  const row = await db("anggota").where({ id }).first();
  if (!row) {
    return res.status(404).json({ message: "Anggota not found" });
  }

  if (payload.no && payload.no !== row.no) {
    const noExists = await db("anggota").where({ no: payload.no }).first();
    if (noExists) {
      return res.status(409).json({ message: "Anggota no already exists" });
    }
  }

  const updates = {
    no: payload.no ?? row.no,
    nip: payload.nip ?? row.nip,
    nama: payload.nama ?? row.nama,
    nik: payload.nik ?? row.nik,
    dept: payload.dept ?? row.dept,
    jabatan: payload.jabatan ?? row.jabatan,
    no_hp: payload.no_hp ?? row.no_hp,
    gaji: payload.gaji ?? row.gaji,
    limit_kredit: payload.limit_kredit ?? row.limit_kredit,
    limit_pinjaman: payload.limit_pinjaman ?? row.limit_pinjaman,
    limit_darurat: payload.limit_darurat ?? row.limit_darurat,
    max_loans: payload.max_loans ?? row.max_loans,
    status: payload.status ?? row.status,
    tgl_masuk: payload.tgl_masuk ?? row.tgl_masuk,
  };

  await db("anggota").where({ id }).update(updates);

  return res.status(200).json({ id });
};

const createAnggota = async (req, res) => {
  const {
    id,
    no,
    nip,
    nama,
    nik,
    dept,
    jabatan,
    no_hp,
    gaji,
    limit_kredit,
    limit_pinjaman,
    limit_darurat,
    max_loans,
    status,
    tgl_masuk
  } = req.body || {};

  if (!id || !no || !nama) {
    return res.status(400).json({ message: "id, no, and nama are required" });
  }

  const exists = await db("anggota").where({ id }).first();
  if (exists) {
    return res.status(409).json({ message: "Anggota id already exists" });
  }

  const noExists = await db("anggota").where({ no }).first();
  if (noExists) {
    return res.status(409).json({ message: "Anggota no already exists" });
  }

  // Default max loans berdasarkan jabatan
  const defaultMaxLoans =
    jabatan && jabatan.toLowerCase() === "manager" ? 5 : 3;

  const payload = {
    id,
    no,
    nip: nip || null,
    nama,
    nik: nik || null,
    dept: dept || null,
    jabatan: jabatan || null,
    no_hp: no_hp || null,
    gaji: gaji || 0,
    limit_kredit: limit_kredit || 3000000,
    limit_pinjaman: limit_pinjaman || 20000000,
    limit_darurat: limit_darurat || 5000000,
    max_loans: max_loans || defaultMaxLoans,
    status: status === undefined ? 1 : status,
    tgl_masuk: tgl_masuk || null
  };

  await db("anggota").insert(payload);

  return res.status(201).json({
    id: payload.id,
    no: payload.no,
    nama: payload.nama
  });
};

module.exports = { listAnggota, getAnggotaById, createAnggota, updateAnggota, deleteAnggota };
