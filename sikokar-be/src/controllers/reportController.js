const { db } = require("../services/db");

const n = (v) => {
  if (v == null || v === "") return 0;
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const summaryReport = async (_req, res) => {
  const [{ total_penjualan = 0 }] = await db("penjualan").sum({ total_penjualan: "total" });
  const [{ total_simpanan = 0 }] = await db("simpanan").sum({ total_simpanan: "saldo" });
  const [{ total_pinjaman = 0 }] = await db("pinjaman").sum({ total_pinjaman: "nominal_disetujui" });
  const [{ outstanding_pinjaman = 0 }] = await db("pinjaman").sum({ outstanding_pinjaman: "sisa_pokok" }).whereNot({ status: "lunas" });

  return res.json({
    data: {
      total_penjualan,
      total_simpanan,
      total_pinjaman,
      outstanding_pinjaman
    }
  });
};

/** Ringkasan multi-modul + deret waktu untuk dashboard laporan. */
const analyticsReport = async (_req, res) => {
  const [
    penjSum,
    penjCnt,
    pemSum,
    pemCnt,
    stokSum,
    stokLines,
    simpananRows,
    pinjStatusRows,
    pinjOutstanding,
    pinjDisetujui,
    kreditJenisRows,
    penjualanByMonth,
    pembelianByMonth,
    stokTopRows
  ] = await Promise.all([
    db("penjualan").sum({ total: "total" }).first(),
    db("penjualan").count("* as c").first(),
    db("pembelian").sum({ total: "total" }).first(),
    db("pembelian").count("* as c").first(),
    db("stok").sum({ jumlah: "jumlah" }).first(),
    db("stok").count("* as c").first(),
    db("simpanan").select("jenis").sum({ saldo: "saldo" }).groupBy("jenis"),
    db("pinjaman").select("status").count("* as c").groupBy("status"),
    db("pinjaman").whereNot({ status: "lunas" }).sum({ sisa: "sisa_pokok" }).first(),
    db("pinjaman").sum({ nominal: "nominal_disetujui" }).first(),
    db("kredit")
      .select("jenis")
      .select(db.raw("COALESCE(SUM(pokok),0) as pokok"))
      .select(db.raw("COALESCE(SUM(sisa),0) as sisa"))
      .select(db.raw("COUNT(*) as c"))
      .groupBy("jenis"),
    db("penjualan")
      .whereNotNull("tgl")
      .select(db.raw("DATE_FORMAT(tgl, '%Y-%m') as period"), db.raw("COALESCE(SUM(`total`),0) as total"), db.raw("COUNT(*) as transaksi"))
      .groupByRaw("DATE_FORMAT(tgl, '%Y-%m')")
      .orderBy("period", "asc"),
    db("pembelian")
      .whereNotNull("tgl")
      .select(db.raw("DATE_FORMAT(tgl, '%Y-%m') as period"), db.raw("COALESCE(SUM(`total`),0) as total"), db.raw("COUNT(*) as transaksi"))
      .groupByRaw("DATE_FORMAT(tgl, '%Y-%m')")
      .orderBy("period", "asc"),
    db("stok")
      .leftJoin("barang", "stok.barang_id", "barang.id")
      .select(db.raw("COALESCE(barang.nama, stok.barang_id) as nama"), db.raw("SUM(stok.jumlah) as jumlah"))
      .groupBy("stok.barang_id", "barang.nama")
      .orderByRaw("SUM(stok.jumlah) DESC")
      .limit(10)
  ]);

  const penjualanByMonthTrim = penjualanByMonth.slice(-12).map((row) => ({
    period: String(row.period),
    total: n(row.total),
    transaksi: n(row.transaksi)
  }));

  const pembelianByMonthTrim = pembelianByMonth.slice(-12).map((row) => ({
    period: String(row.period),
    total: n(row.total),
    transaksi: n(row.transaksi)
  }));

  const simpananByJenis = simpananRows.map((r) => ({
    jenis: String(r.jenis || "lain"),
    saldo: n(r.saldo)
  }));

  const pinjamanByStatus = pinjStatusRows.map((r) => ({
    status: String(r.status || ""),
    count: n(r.c)
  }));

  const kreditByJenis = kreditJenisRows.map((r) => ({
    jenis: String(r.jenis || "lain"),
    pokok: n(r.pokok),
    sisa: n(r.sisa),
    count: n(r.c)
  }));

  const stokTop = stokTopRows.map((r) => ({
    nama: String(r.nama || "—").slice(0, 40),
    jumlah: n(r.jumlah)
  }));

  const pinjAktifRow = pinjamanByStatus.find((x) => x.status === "aktif");

  return res.json({
    data: {
      generatedAt: new Date().toISOString(),
      kpis: {
        penjualan: { total: n(penjSum?.total), count: n(penjCnt?.c) },
        pembelian: { total: n(pemSum?.total), count: n(pemCnt?.c) },
        stok: { totalUnit: n(stokSum?.jumlah), baris: n(stokLines?.c) },
        simpanan: { total: simpananByJenis.reduce((s, x) => s + x.saldo, 0) },
        pinjaman: {
          outstanding: n(pinjOutstanding?.sisa),
          totalDisetujui: n(pinjDisetujui?.nominal),
          countAktif: pinjAktifRow ? pinjAktifRow.count : 0
        },
        kredit: {
          totalSisa: kreditByJenis.reduce((s, x) => s + x.sisa, 0),
          count: kreditByJenis.reduce((s, x) => s + x.count, 0)
        }
      },
      penjualanByMonth: penjualanByMonthTrim,
      pembelianByMonth: pembelianByMonthTrim,
      simpananByJenis,
      pinjamanByStatus,
      kreditByJenis,
      stokTop
    }
  });
};

module.exports = { summaryReport, analyticsReport };
