const { randomUUID } = require("crypto");
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

  const catatan = [];
  catatan.push("Pengajuan masuk antrian Approval; keputusan akhir hanya oleh admin (setujui/tolak manual).");
  if (frekuensi >= maxPengajuan) {
    catatan.push(
      `Frekuensi data pinjaman anggota sudah ${frekuensi} (maks. ${maxPengajuan}): sistem merekomendasikan penolakan, tetapi admin tetap dapat menyetujui jika diperlukan.`
    );
  }
  if (nominalReq > sisaLimit) {
    catatan.push(
      "Nominal melebihi sisa limit plafon jabatan: sistem merekomendasikan penolakan; admin dapat menolak atau menyetujui secara manual."
    );
  } else {
    catatan.push("Nominal tidak melebihi sisa plafon jabatan (sebelum pengajuan ini).");
  }
  reason = catatan.join(" ");

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

const normalizeMetodePinjaman = (raw) => {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "tunai") return "tunai";
  if (s === "transfer") return "transfer";
  if (s === "potong gaji" || s === "potong-gaji" || s === "potonggaji") return "potong-gaji";
  return null;
};

/** Catat pembayaran angsuran bulanan + kurangi sisa pokok; otomatis lunas jika sisa habis. */
const bayarAngsuran = async (req, res) => {
  const { id } = req.params || {};
  const { tanggal, metode } = req.body || {};

  if (!tanggal) {
    return res.status(400).json({ message: "tanggal wajib diisi" });
  }

  const metodeNorm = normalizeMetodePinjaman(metode);
  if (!metodeNorm) {
    return res.status(400).json({ message: "Metode harus Tunai, Transfer, atau Potong Gaji" });
  }

  const row = await db("pinjaman").where({ id }).first();
  if (!row) {
    return res.status(404).json({ message: "Pinjaman not found" });
  }
  if (row.status !== "aktif") {
    return res.status(400).json({ message: "Hanya pinjaman aktif yang dapat diangsur" });
  }

  const sisa = Number(row.sisa_pokok || 0);
  if (sisa <= 0) {
    return res.status(400).json({ message: "Tidak ada sisa pokok untuk dibayar" });
  }

  const nominal = Number(row.nominal_disetujui || 0);
  const tenor = Number(row.tenor || 12) || 12;
  const bungaPct = Number(row.bunga_pct || 0);
  const pokokPerMonth = tenor > 0 ? nominal / tenor : nominal;
  const bungaPerMonth = (nominal * bungaPct) / 100;
  const angsuranPlanned = Number(row.angsuran_per_bulan || pokokPerMonth + bungaPerMonth);

  let bayarPokok = Math.min(pokokPerMonth, sisa);
  let bayarBunga = Math.min(bungaPerMonth, Math.max(0, angsuranPlanned - bayarPokok));
  bayarPokok = Math.min(bayarPokok, sisa);
  const nominalTotal = bayarPokok + bayarBunga;

  const userId = req.user && req.user.id ? req.user.id : null;
  const bayarId = randomUUID();

  let resultStatus = "aktif";
  let resultSisa = sisa;

  await db.transaction(async (trx) => {
    const [cntRow] = await trx("pinjaman_bayar").where({ pinjaman_id: id }).count("* as total");
    const cicilanKe = Number(cntRow?.total ?? 0) + 1;

    await trx("pinjaman_bayar").insert({
      id: bayarId,
      pinjaman_id: id,
      tgl: tanggal,
      nominal_total: nominalTotal,
      bayar_pokok: bayarPokok,
      bayar_bunga: bayarBunga,
      cicilan_ke: cicilanKe,
      metode: metodeNorm,
      user_id: userId
    });

    resultSisa = Math.max(0, Math.round((sisa - bayarPokok) * 100) / 100);
    resultStatus = resultSisa <= 0.01 ? "lunas" : "aktif";

    await trx("pinjaman")
      .where({ id })
      .update({
        sisa_pokok: resultStatus === "lunas" ? 0 : resultSisa,
        status: resultStatus
      });
  });

  return res.json({ id, status: resultStatus, sisa_pokok: resultStatus === "lunas" ? 0 : resultSisa });
};

/** Tandai pinjaman lunas (sisa pokok dibayar penuh). */
const lunasiPinjaman = async (req, res) => {
  const { id } = req.params || {};
  const row = await db("pinjaman").where({ id }).first();
  if (!row) {
    return res.status(404).json({ message: "Pinjaman not found" });
  }
  if (row.status !== "aktif") {
    return res.status(400).json({ message: "Hanya pinjaman aktif yang dapat dilunasi" });
  }

  const sisa = Number(row.sisa_pokok || 0);
  const userId = req.user && req.user.id ? req.user.id : null;

  await db.transaction(async (trx) => {
    if (sisa > 0) {
      const [cntRow] = await trx("pinjaman_bayar").where({ pinjaman_id: id }).count("* as total");
      const cicilanKe = Number(cntRow?.total ?? 0) + 1;
      const tgl = new Date().toISOString().slice(0, 10);
      await trx("pinjaman_bayar").insert({
        id: randomUUID(),
        pinjaman_id: id,
        tgl,
        nominal_total: sisa,
        bayar_pokok: sisa,
        bayar_bunga: 0,
        cicilan_ke: cicilanKe,
        metode: "pelunasan",
        user_id: userId
      });
    }
    await trx("pinjaman").where({ id }).update({ sisa_pokok: 0, status: "lunas" });
  });

  return res.json({ id, status: "lunas" });
};

module.exports = {
  listPinjaman,
  getPinjamanById,
  createPinjaman,
  updatePinjaman,
  bayarAngsuran,
  lunasiPinjaman
};
