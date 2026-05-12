const { db } = require("../services/db");

/** Plafon per jabatan (Rp). */
const LOAN_CAP_BY_ROLE = {
  manager: 50_000_000,
  hrd: 30_000_000,
  staff: 10_000_000,
};

/** Default maks. data pinjaman per anggota (selaras master anggota / FE). */
const maxLoansFromJabatan = (jabatan) => {
  const j = String(jabatan || "")
    .toLowerCase()
    .trim();
  if (j === "manager" || j.includes("manager")) return 5;
  return 3;
};

const maxPengajuanForAnggota = (anggota) => {
  const stored = Number(anggota.max_loans);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return maxLoansFromJabatan(anggota.jabatan);
};

const resolveLoanCap = (jabatan) => {
  const j = String(jabatan || "")
    .toLowerCase()
    .trim();
  if (j === "manager" || j.includes("manager")) {
    return LOAN_CAP_BY_ROLE.manager;
  }
  if (j === "hrd" || j.includes("hrd") || j.includes("human resource")) {
    return LOAN_CAP_BY_ROLE.hrd;
  }
  return LOAN_CAP_BY_ROLE.staff;
};

const sumUsedLimit = (rows) =>
  rows.reduce((sum, row) => {
    const st = row.status;
    if (st === "aktif") {
      return sum + Number(row.sisa_pokok || row.nominal_disetujui || row.nominal_pengajuan || 0);
    }
    if (st === "pending") {
      return sum + Number(row.nominal_pengajuan || 0);
    }
    return sum;
  }, 0);

const computeAngsuranPerBulan = (nominal, tenor, bungaPct) => {
  const n = Number(nominal) || 0;
  const t = Number(tenor) || 12;
  const b = Number(bungaPct) || 0;
  const totalBunga = (n * b * t) / 100;
  const totalBayar = n + totalBunga;
  return t > 0 ? totalBayar / t : 0;
};

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
    tenor,
    bunga_pct,
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

  const anggota = await db("anggota").where({ id: anggota_id }).first();
  if (!anggota) {
    return res.status(404).json({ message: "Anggota not found" });
  }

  const nominalReq = Number(nominal_pengajuan) || 0;
  if (nominalReq <= 0) {
    return res.status(400).json({ message: "nominal_pengajuan must be greater than 0" });
  }

  const tenorNum = Number(tenor) || 12;
  const jenisVal = jenis || "regular";
  const bungaVal = jenisVal === "darurat" ? 1.0 : Number(bunga_pct) || 1.5;

  const [freqRow] = await db("pinjaman").where({ anggota_id }).count("* as total");
  const frekuensi = Number(freqRow?.total ?? 0);

  const siblings = await db("pinjaman").where({ anggota_id }).whereIn("status", ["pending", "aktif"]);
  const terpakai = sumUsedLimit(siblings);
  const plafon = resolveLoanCap(anggota.jabatan);
  const sisaLimit = Math.max(0, plafon - terpakai);

  let finalStatus = "pending";
  let nominalDisetujui = 0;
  let sisaPokok = 0;
  let angsuranVal = 0;
  let reason = "";

  const maxPengajuan = maxPengajuanForAnggota(anggota);
  if (frekuensi >= maxPengajuan) {
    finalStatus = "ditolak";
    nominalDisetujui = 0;
    sisaPokok = 0;
    angsuranVal = 0;
    reason = `Ditolak: sudah mencapai maksimal ${maxPengajuan} kali pengajuan pinjaman (batas anggota / jabatan).`;
  } else {
    finalStatus = "pending";
    nominalDisetujui = 0;
    sisaPokok = 0;
    angsuranVal = 0;
    reason =
      nominalReq <= sisaLimit
        ? "Menunggu persetujuan di halaman Approval (nominal masih dalam sisa limit plafon)."
        : "Menunggu persetujuan di halaman Approval (nominal melebihi sisa limit plafon jabatan).";
  }

  const payload = {
    id,
    no,
    anggota_id,
    jenis: jenisVal,
    nominal_pengajuan: nominalReq,
    nominal_disetujui: nominalDisetujui,
    tenor: tenorNum,
    bunga_pct: bungaVal,
    angsuran_per_bulan: angsuranVal,
    sisa_pokok: sisaPokok,
    status: finalStatus,
    tgl_pengajuan: tgl_pengajuan || null,
    tgl_cair: null,
    user_id: user_id || null
  };

  await db("pinjaman").insert(payload);

  return res.status(201).json({
    id: payload.id,
    no: payload.no,
    status: payload.status,
    reason,
    plafon_jabatan: plafon,
    sisa_limit: sisaLimit,
    terpakai_sebelumnya: terpakai,
    frekuensi_sebelumnya: frekuensi
  });
};

const updatePinjaman = async (req, res) => {
  const { id } = req.params || {};
  const { status } = req.body || {};

  const row = await db("pinjaman").where({ id }).first();
  if (!row) {
    return res.status(404).json({ message: "Pinjaman not found" });
  }

  if (row.status !== "pending") {
    return res.status(400).json({ message: "Hanya pengajuan berstatus pending yang dapat diproses" });
  }

  if (status === "ditolak") {
    await db("pinjaman")
      .where({ id })
      .update({
        status: "ditolak",
        nominal_disetujui: 0,
        sisa_pokok: 0,
        angsuran_per_bulan: 0,
        tgl_cair: null
      });
    return res.json({ id, status: "ditolak" });
  }

  if (status !== "aktif") {
    return res.status(400).json({ message: "status harus aktif atau ditolak" });
  }

  const anggota = await db("anggota").where({ id: row.anggota_id }).first();
  if (!anggota) {
    return res.status(404).json({ message: "Anggota not found" });
  }

  const nominalReq = Number(row.nominal_pengajuan) || 0;
  const tenorNum = Number(row.tenor) || 12;
  const bungaVal = Number(row.bunga_pct) || (row.jenis === "darurat" ? 1.0 : 1.5);

  const others = await db("pinjaman")
    .where({ anggota_id: row.anggota_id })
    .where("id", "!=", id)
    .whereIn("status", ["pending", "aktif"]);
  const terpakai = sumUsedLimit(others);
  const plafon = resolveLoanCap(anggota.jabatan);
  const sisaLimit = Math.max(0, plafon - terpakai);

  if (nominalReq > sisaLimit) {
    return res.status(400).json({
      message: `Tidak dapat menyetujui: nominal melebihi sisa limit plafon (sisa ${sisaLimit}).`
    });
  }

  const angsuranVal = computeAngsuranPerBulan(nominalReq, tenorNum, bungaVal);
  const today = new Date().toISOString().slice(0, 10);

  await db("pinjaman")
    .where({ id })
    .update({
      status: "aktif",
      nominal_disetujui: nominalReq,
      sisa_pokok: nominalReq,
      angsuran_per_bulan: angsuranVal,
      tgl_cair: today
    });

  return res.json({ id, status: "aktif" });
};

module.exports = { listPinjaman, getPinjamanById, createPinjaman, updatePinjaman };
