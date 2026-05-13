"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AngsuranModal from "@/components/AngsuranModal";
import LunasDialog from "@/components/LunasDialog";
import {
  getReportsAnalytics,
  listAnggota,
  listBarang,
  listKredit,
  listLokasi,
  listPembelian,
  listPenjualan,
  listPinjaman,
  listSimpanan,
  listStok,
  listSupplier,
  type Anggota,
  type Barang,
  type Kredit,
  type Lokasi,
  type Pembelian,
  type Pinjaman,
  type ReportsAnalyticsData,
  type Simpanan,
  type Stok,
  type Supplier,
  type Penjualan,
} from "@/lib/api";
import { bayarAngsuran, lunasiPinjaman } from "@/lib/loan-actions";
import { downloadCsv, downloadExcelCsv, printReportHtml } from "@/components/reports/reportExport";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fmtRp = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat("id-ID").format(v);

type TabId = "penjualan" | "pembelian" | "stok" | "simpanan" | "pinjaman" | "ppob" | "kredit";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "penjualan", label: "Penjualan", icon: "🛒" },
  { id: "pembelian", label: "Pembelian", icon: "📄" },
  { id: "stok", label: "Stok", icon: "📦" },
  { id: "simpanan", label: "Simpanan", icon: "🏦" },
  { id: "pinjaman", label: "Pinjaman", icon: "💳" },
  { id: "ppob", label: "PPOB", icon: "⚡" },
  { id: "kredit", label: "Kredit Motor/Elek", icon: "🏍️" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function inRange(d: string | null | undefined, from: string, to: string): boolean {
  if (!d || !from || !to) return true;
  const x = d.slice(0, 10);
  return x >= from && x <= to;
}

function pinjamanTanggal(p: Pinjaman): string {
  return (p.tgl_cair || p.tgl_pengajuan || "").slice(0, 10);
}

export default function ReportsTabbedDashboard() {
  const [tab, setTab] = useState<TabId>("penjualan");
  const [from, setFrom] = useState(() => startOfMonthISO());
  const [to, setTo] = useState(() => todayISO());
  const [appliedFrom, setAppliedFrom] = useState(() => startOfMonthISO());
  const [appliedTo, setAppliedTo] = useState(() => todayISO());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [pembelian, setPembelian] = useState<Pembelian[]>([]);
  const [stok, setStok] = useState<Stok[]>([]);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [simpanan, setSimpanan] = useState<Simpanan[]>([]);
  const [pinjaman, setPinjaman] = useState<Pinjaman[]>([]);
  const [kredit, setKredit] = useState<Kredit[]>([]);
  const [analytics, setAnalytics] = useState<ReportsAnalyticsData | null>(null);

  const [showAngsur, setShowAngsur] = useState(false);
  const [showLunas, setShowLunas] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [
        pj,
        pb,
        st,
        br,
        lk,
        sup,
        ag,
        sm,
        pjmn,
        kr,
        analyticsRes,
      ] = await Promise.all([
        listPenjualan(),
        listPembelian(),
        listStok(),
        listBarang(),
        listLokasi(),
        listSupplier(),
        listAnggota(),
        listSimpanan(),
        listPinjaman(),
        listKredit(),
        getReportsAnalytics().catch(() => null),
      ]);
      setPenjualan(pj.data || []);
      setPembelian(pb.data || []);
      setStok(st.data || []);
      setBarang(br.data || []);
      setLokasi(lk.data || []);
      setSupplier(sup.data || []);
      setAnggota(ag.data || []);
      setSimpanan(sm.data || []);
      setPinjaman(pjmn.data || []);
      setKredit(kr.data || []);
      setAnalytics(analyticsRes?.data ?? null);
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Gagal memuat data";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilter = () => {
    setAppliedFrom(from);
    setAppliedTo(to);
  };
  const resetFilter = () => {
    const f = startOfMonthISO();
    const t = todayISO();
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  };

  const lokasiSorted = useMemo(() => [...lokasi].sort((a, b) => (a.kode || a.nama || "").localeCompare(b.kode || b.nama || "")), [lokasi]);
  const lokasi1 = lokasiSorted[0];
  const lokasi2 = lokasiSorted[1];

  const lokasiName = useCallback((id?: string | null) => lokasi.find((l) => l.id === id)?.nama || "—", [lokasi]);
  const supplierName = useCallback((id?: string | null) => supplier.find((s) => s.id === id)?.nama || "—", [supplier]);
  const anggotaById = useCallback((id: string) => anggota.find((a) => a.id === id), [anggota]);

  const penjFiltered = useMemo(
    () => penjualan.filter((r) => inRange(r.tgl, appliedFrom, appliedTo)),
    [penjualan, appliedFrom, appliedTo]
  );
  const pemFiltered = useMemo(
    () => pembelian.filter((r) => inRange(r.tgl, appliedFrom, appliedTo)),
    [pembelian, appliedFrom, appliedTo]
  );
  const pinjFiltered = useMemo(
    () => pinjaman.filter((r) => inRange(pinjamanTanggal(r), appliedFrom, appliedTo)),
    [pinjaman, appliedFrom, appliedTo]
  );
  const kreditFiltered = useMemo(
    () => kredit.filter((r) => inRange(r.tgl_mulai, appliedFrom, appliedTo)),
    [kredit, appliedFrom, appliedTo]
  );

  const penjOmzet = useMemo(() => penjFiltered.reduce((s, r) => s + Number(r.total || 0), 0), [penjFiltered]);
  const penjLok1 = useMemo(
    () => (lokasi1 ? penjFiltered.filter((r) => r.lokasi_id === lokasi1.id).reduce((s, r) => s + Number(r.total || 0), 0) : 0),
    [penjFiltered, lokasi1]
  );
  const penjLok2 = useMemo(
    () => (lokasi2 ? penjFiltered.filter((r) => r.lokasi_id === lokasi2.id).reduce((s, r) => s + Number(r.total || 0), 0) : 0),
    [penjFiltered, lokasi2]
  );

  const pemTotal = useMemo(() => pemFiltered.reduce((s, r) => s + Number(r.total || 0), 0), [pemFiltered]);

  const stokRows = useMemo(() => {
    const byBarang = new Map<string, { barang: Barang; byLok: Record<string, number> }>();
    for (const b of barang) {
      byBarang.set(b.id, { barang: b, byLok: {} });
    }
    for (const s of stok) {
      const bid = s.barang_id;
      if (!byBarang.has(bid)) {
        const ghost: Barang = { id: bid, kode: bid, nama: bid };
        byBarang.set(bid, { barang: ghost, byLok: {} });
      }
      const lid = s.lokasi_id || "_";
      const row = byBarang.get(bid)!;
      row.byLok[lid] = (row.byLok[lid] || 0) + Number(s.jumlah || 0);
    }
    const lokIds = lokasiSorted.map((l) => l.id);
    const out: Array<{
      kode: string;
      nama: string;
      kategori: string;
      hJual: number;
      qtys: number[];
      totalQty: number;
      nilai: number;
    }> = [];
    for (const { barang: b, byLok } of byBarang.values()) {
      const qtys = lokIds.slice(0, 2).map((lid) => byLok[lid] || 0);
      const totalQty = Object.values(byLok).reduce((a, c) => a + c, 0);
      const hJual = Number(b.harga_jual || 0);
      out.push({
        kode: b.kode,
        nama: b.nama,
        kategori: b.kategori || "—",
        hJual,
        qtys,
        totalQty,
        nilai: hJual * totalQty,
      });
    }
    out.sort((a, b) => b.nilai - a.nilai);
    return { rows: out, lokIds: lokIds.slice(0, 2), lokLabels: lokasiSorted.slice(0, 2).map((l) => l.nama) };
  }, [barang, stok, lokasiSorted]);

  const totalNilaiStok = useMemo(() => stokRows.rows.reduce((s, r) => s + r.nilai, 0), [stokRows.rows]);

  const simpananPivot = useMemo(() => {
    const map = new Map<string, { ag: Anggota; pokok: number; wajib: number; sukarela: number }>();
    for (const s of simpanan) {
      const ag = anggota.find((a) => a.id === s.anggota_id);
      if (!ag) continue;
      if (!map.has(ag.id)) map.set(ag.id, { ag, pokok: 0, wajib: 0, sukarela: 0 });
      const row = map.get(ag.id)!;
      const j = (s.jenis || "").toLowerCase();
      const v = Number(s.saldo || 0);
      if (j === "pokok") row.pokok += v;
      else if (j === "wajib") row.wajib += v;
      else if (j === "sukarela") row.sukarela += v;
    }
    const list = [...map.values()].sort((a, b) => a.ag.nama.localeCompare(b.ag.nama));
    const totalAll = list.reduce((s, r) => s + r.pokok + r.wajib + r.sukarela, 0);
    return { list, totalAll };
  }, [simpanan, anggota]);

  const pinjOutstanding = useMemo(
    () => pinjFiltered.filter((p) => p.status === "aktif").reduce((s, p) => s + Number(p.sisa_pokok || 0), 0),
    [pinjFiltered]
  );
  const pinjAngsurBln = useMemo(
    () => pinjFiltered.filter((p) => p.status === "aktif").reduce((s, p) => s + Number(p.angsuran_per_bulan || 0), 0),
    [pinjFiltered]
  );

  const kreditMotorSisa = useMemo(
    () => kreditFiltered.filter((k) => (k.jenis || "").toLowerCase() === "kendaraan").reduce((s, k) => s + Number(k.sisa || 0), 0),
    [kreditFiltered]
  );
  const kreditElekSisa = useMemo(
    () => kreditFiltered.filter((k) => (k.jenis || "").toLowerCase() === "elektronik").reduce((s, k) => s + Number(k.sisa || 0), 0),
    [kreditFiltered]
  );
  const kreditAngsurBln = useMemo(() => kreditFiltered.reduce((s, k) => s + Number(k.angsuran_per_bulan || 0), 0), [kreditFiltered]);

  const chartPenj = useMemo(() => {
    if (!analytics?.penjualanByMonth?.length) return [];
    return analytics.penjualanByMonth.slice(-8).map((r) => ({ period: r.period, total: r.total }));
  }, [analytics]);

  const exportCurrent = (kind: "csv" | "excel" | "print") => {
    if (tab === "ppob") return;
    const title = `Laporan — ${TABS.find((t) => t.id === tab)?.label || tab}`;
    if (tab === "penjualan") {
      const headers = ["NO", "TANGGAL", "TOKO", "JENIS", "ANGGOTA", "SUBTOTAL", "DISKON", "PPN", "TOTAL"];
      const rows = penjFiltered.map((r) => [
        r.no,
        r.tgl,
        lokasiName(r.lokasi_id),
        r.jenis,
        r.anggota_id ? anggotaById(r.anggota_id)?.nama || r.anggota_id : "—",
        Number(r.subtotal ?? 0),
        Number(r.diskon_total ?? 0),
        Number(r.ppn_total ?? 0),
        Number(r.total ?? 0),
      ]);
      if (kind === "print") {
        printReportHtml(
          title,
          `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        );
        return;
      }
      const fn = `laporan_penjualan_${appliedFrom}_${appliedTo}`;
      if (kind === "excel") downloadExcelCsv(fn, headers, rows);
      else downloadCsv(fn + ".csv", headers, rows);
    } else if (tab === "pembelian") {
      const headers = ["NO", "TANGGAL", "SUPPLIER", "TOKO", "TOTAL", "STATUS"];
      const rows = pemFiltered.map((r) => [
        r.no,
        r.tgl,
        supplierName(r.supplier_id),
        lokasiName(r.lokasi_id),
        Number(r.total ?? 0),
        r.status || "—",
      ]);
      if (kind === "print") {
        printReportHtml(
          title,
          `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        );
        return;
      }
      const fn = `laporan_pembelian_${appliedFrom}_${appliedTo}`;
      if (kind === "excel") downloadExcelCsv(fn, headers, rows);
      else downloadCsv(fn + ".csv", headers, rows);
    } else if (tab === "stok") {
      const h = ["KODE", "NAMA", "KATEGORI", "H.JUAL", ...stokRows.lokLabels.map((_, i) => `STOK ${i + 1}`), "TOTAL", "NILAI"];
      const rows = stokRows.rows.map((r) => [r.kode, r.nama, r.kategori, r.hJual, ...r.qtys, r.totalQty, r.nilai]);
      if (kind === "print") {
        printReportHtml(title, `<table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        return;
      }
      const fn = "laporan_stok";
      if (kind === "excel") downloadExcelCsv(fn, h, rows);
      else downloadCsv(fn + ".csv", h, rows);
    } else if (tab === "simpanan") {
      const h = ["NO ANGG", "NIP", "NAMA", "DEPT", "POKOK", "WAJIB", "SUKARELA", "TOTAL"];
      const rows = simpananPivot.list.map((r) => [
        r.ag.no,
        r.ag.nip || "—",
        r.ag.nama,
        r.ag.dept || "—",
        r.pokok,
        r.wajib,
        r.sukarela,
        r.pokok + r.wajib + r.sukarela,
      ]);
      if (kind === "print") {
        printReportHtml(title, `<table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        return;
      }
      const fn = "laporan_simpanan";
      if (kind === "excel") downloadExcelCsv(fn, h, rows);
      else downloadCsv(fn + ".csv", h, rows);
    } else if (tab === "pinjaman") {
      const h = ["NO", "TGL PENGAJUAN", "TGL CAIR", "ANGGOTA", "NIP", "JENIS", "NOMINAL", "ANGSURAN/BLN", "SISA POKOK", "STATUS"];
      const rows = pinjFiltered.map((p) => {
        const ag = anggotaById(p.anggota_id);
        return [
          p.no,
          p.tgl_pengajuan || "—",
          p.tgl_cair || "—",
          ag?.nama || p.anggota_id,
          ag?.nip || "—",
          p.jenis,
          Number(p.nominal_disetujui || p.nominal_pengajuan || 0),
          Number(p.angsuran_per_bulan || 0),
          Number(p.sisa_pokok || 0),
          p.status,
        ];
      });
      if (kind === "print") {
        printReportHtml(title, `<table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        return;
      }
      const fn = `laporan_pinjaman_${appliedFrom}_${appliedTo}`;
      if (kind === "excel") downloadExcelCsv(fn, h, rows);
      else downloadCsv(fn + ".csv", h, rows);
    } else if (tab === "kredit") {
      const h = ["NO", "TGL MULAI", "ANGGOTA", "NIP", "JENIS", "NAMA BARANG", "TOKO", "HARGA", "DP", "BUNGA%", "TENOR", "ANGSURAN/BLN", "SISA", "STATUS"];
      const rows = kreditFiltered.map((k) => {
        const ag = anggotaById(k.anggota_id);
        return [
          k.no,
          k.tgl_mulai || "—",
          ag?.nama || k.anggota_id,
          ag?.nip || "—",
          k.jenis,
          k.nama_barang || "—",
          k.toko || "—",
          Number(k.harga_beli || 0),
          Number(k.dp || 0),
          Number(k.bunga_pct || 0),
          Number(k.tenor || 0),
          Number(k.angsuran_per_bulan || 0),
          Number(k.sisa || 0),
          k.status || "—",
        ];
      });
      if (kind === "print") {
        printReportHtml(title, `<table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        return;
      }
      const fn = `laporan_kredit_${appliedFrom}_${appliedTo}`;
      if (kind === "excel") downloadExcelCsv(fn, h, rows);
      else downloadCsv(fn + ".csv", h, rows);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Memuat laporan…</div>;
  }
  if (err) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-xl" aria-hidden>
              📊
            </span>
            <h1 className="text-xl font-semibold tracking-tight">Laporan &amp; Analisis</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Filter data per periode &amp; export</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={tab === "ppob"}
            onClick={() => exportCurrent("excel")}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Excel
          </button>
          <button
            type="button"
            disabled={tab === "ppob"}
            onClick={() => exportCurrent("csv")}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            CSV
          </button>
          <button
            type="button"
            disabled={tab === "ppob"}
            onClick={() => exportCurrent("print")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Print
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "ppob" && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500">Tanggal</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              <span className="text-xs text-slate-500">s/d</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
            </div>
          </div>
          <button type="button" onClick={applyFilter} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Filter
          </button>
          <button type="button" onClick={resetFilter} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Reset
          </button>
        </div>
      )}

      {notice && (
        <div className={`rounded-xl border px-3 py-2 text-sm ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {notice.text}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => setNotice(null)}>
            Tutup
          </button>
        </div>
      )}

      {tab === "penjualan" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard tone="sky" label="Total omzet" value={fmtRp(penjOmzet)} />
            <SummaryCard tone="emerald" label={lokasi1?.nama || "Lokasi 1"} value={fmtRp(penjLok1)} />
            <SummaryCard tone="amber" label={lokasi2?.nama || "Lokasi 2"} value={fmtRp(penjLok2)} />
            <SummaryCard tone="violet" label="Transaksi" value={fmtNum(penjFiltered.length)} />
          </div>
          <p className="text-sm text-slate-600">
            Periode: <span className="font-medium">{appliedFrom}</span> s/d <span className="font-medium">{appliedTo}</span>
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Toko</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Anggota</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2 text-right">Diskon</th>
                  <th className="px-3 py-2 text-right">PPN</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {penjFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                      Tidak ada data untuk periode ini
                    </td>
                  </tr>
                ) : (
                  penjFiltered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono text-xs">{r.no}</td>
                      <td className="px-3 py-2">{r.tgl}</td>
                      <td className="px-3 py-2">{lokasiName(r.lokasi_id)}</td>
                      <td className="px-3 py-2">{r.jenis}</td>
                      <td className="px-3 py-2">{r.anggota_id ? anggotaById(r.anggota_id)?.nama || "—" : "—"}</td>
                      <td className="px-3 py-2 text-right">{fmtRp(Number(r.subtotal ?? 0))}</td>
                      <td className="px-3 py-2 text-right">{fmtRp(Number(r.diskon_total ?? 0))}</td>
                      <td className="px-3 py-2 text-right">{fmtRp(Number(r.ppn_total ?? 0))}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmtRp(Number(r.total ?? 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {chartPenj.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Tren penjualan (global per bulan)</div>
              <div className="mt-3 h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPenj}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}jt`} />
                    <Tooltip formatter={(v: number) => fmtRp(Number(v))} />
                    <Bar dataKey="total" fill="#4f46e5" name="Penjualan" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "pembelian" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">
            Total pembelian: {fmtRp(pemTotal)} · {fmtNum(pemFiltered.length)} transaksi
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Toko</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pemFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  pemFiltered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono text-xs">{r.no}</td>
                      <td className="px-3 py-2">{r.tgl}</td>
                      <td className="px-3 py-2">{supplierName(r.supplier_id)}</td>
                      <td className="px-3 py-2">{lokasiName(r.lokasi_id)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmtRp(Number(r.total || 0))}</td>
                      <td className="px-3 py-2">{r.status || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "stok" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-800">Nilai stok total: {fmtRp(totalNilaiStok)}</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Kode</th>
                  <th className="px-3 py-2">Nama barang</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2 text-right">H. jual</th>
                  {stokRows.lokLabels.map((lbl) => (
                    <th key={lbl} className="px-3 py-2 text-right">
                      {lbl}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right">Total stok</th>
                  <th className="px-3 py-2 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {stokRows.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + stokRows.lokLabels.length + 2} className="px-3 py-8 text-center text-slate-500">
                      Tidak ada data stok
                    </td>
                  </tr>
                ) : (
                  stokRows.rows.map((r) => (
                    <tr key={r.kode} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono text-xs">{r.kode}</td>
                      <td className="px-3 py-2">{r.nama}</td>
                      <td className="px-3 py-2">{r.kategori}</td>
                      <td className="px-3 py-2 text-right">{fmtRp(r.hJual)}</td>
                      {r.qtys.map((q, i) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {fmtNum(q)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-medium">{fmtNum(r.totalQty)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-indigo-800">{fmtRp(r.nilai)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {stokRows.rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={4 + stokRows.lokLabels.length + 1} className="px-3 py-2 text-right">
                      Total nilai
                    </td>
                    <td className="px-3 py-2 text-right text-indigo-900">{fmtRp(totalNilaiStok)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {tab === "simpanan" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-800">Total simpanan: {fmtRp(simpananPivot.totalAll)}</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">No angg</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Dept</th>
                  <th className="px-3 py-2 text-right">Pokok</th>
                  <th className="px-3 py-2 text-right">Wajib</th>
                  <th className="px-3 py-2 text-right">Sukarela</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {simpananPivot.list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      Tidak ada data simpanan
                    </td>
                  </tr>
                ) : (
                  simpananPivot.list.map((r) => {
                    const tot = r.pokok + r.wajib + r.sukarela;
                    return (
                      <tr key={r.ag.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-3 py-2">{r.ag.no}</td>
                        <td className="px-3 py-2">{r.ag.nip || "—"}</td>
                        <td className="px-3 py-2">{r.ag.nama}</td>
                        <td className="px-3 py-2">{r.ag.dept || "—"}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(r.pokok)}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(r.wajib)}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(r.sukarela)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtRp(tot)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {simpananPivot.list.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={7} className="px-3 py-2 text-right">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">{fmtRp(simpananPivot.totalAll)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {tab === "pinjaman" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard tone="rose" label="Outstanding" value={fmtRp(pinjOutstanding)} />
            <SummaryCard tone="amber" label="Angsuran / bulan (aktif, periode)" value={fmtRp(pinjAngsurBln)} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">No pinjaman</th>
                  <th className="px-3 py-2">Tgl pengajuan</th>
                  <th className="px-3 py-2">Tgl cair</th>
                  <th className="px-3 py-2">Anggota</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2 text-right">Nominal</th>
                  <th className="px-3 py-2 text-right">Angsuran/bln</th>
                  <th className="px-3 py-2 text-right">Sisa pokok</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pinjFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                      Tidak ada data pinjaman untuk periode ini
                    </td>
                  </tr>
                ) : (
                  pinjFiltered.map((p) => {
                    const ag = anggotaById(p.anggota_id);
                    const st = p.status;
                    const stCls =
                      st === "aktif" ? "bg-amber-100 text-amber-900" : st === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
                    const sisa = Number(p.sisa_pokok || 0);
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono text-xs">{p.no}</td>
                        <td className="px-3 py-2">{p.tgl_pengajuan || "—"}</td>
                        <td className="px-3 py-2">{p.tgl_cair || "—"}</td>
                        <td className="px-3 py-2">{ag?.nama || "—"}</td>
                        <td className="px-3 py-2">{ag?.nip || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.jenis === "darurat" ? "bg-amber-50 text-amber-900" : "bg-sky-50 text-sky-900"}`}>{p.jenis}</span>
                        </td>
                        <td className="px-3 py-2 text-right">{fmtRp(Number(p.nominal_disetujui || p.nominal_pengajuan || 0))}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(Number(p.angsuran_per_bulan || 0))}</td>
                        <td className={`px-3 py-2 text-right font-medium ${sisa === 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtRp(sisa)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stCls}`}>{st}</span>
                        </td>
                        <td className="px-3 py-2">
                          {st === "aktif" ? (
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                                onClick={() => {
                                  setSelectedPinjaman(p);
                                  setShowAngsur(true);
                                }}
                              >
                                Angsur
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-sky-600 px-2 py-1 text-xs font-semibold text-sky-700"
                                onClick={() => {
                                  setSelectedPinjaman(p);
                                  setShowLunas(true);
                                }}
                              >
                                Lunas
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "ppob" && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-8 text-center">
          <p className="text-lg font-semibold text-amber-950">PPOB</p>
          <p className="mt-2 text-sm text-amber-900/90">Laporan PPOB masih dalam tahap pengembangan.</p>
        </div>
      )}

      {tab === "kredit" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard tone="amber" label="Motor — outstanding" value={fmtRp(kreditMotorSisa)} />
            <SummaryCard tone="emerald" label="Elektronik — outstanding" value={fmtRp(kreditElekSisa)} />
            <SummaryCard tone="sky" label="Total angsuran / bln" value={fmtRp(kreditAngsurBln)} />
            <SummaryCard tone="violet" label="Total kontrak" value={fmtNum(kreditFiltered.length)} />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">No kredit</th>
                  <th className="px-3 py-2">Tgl mulai</th>
                  <th className="px-3 py-2">Anggota</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Nama barang</th>
                  <th className="px-3 py-2">Toko</th>
                  <th className="px-3 py-2 text-right">Harga beli</th>
                  <th className="px-3 py-2 text-right">DP</th>
                  <th className="px-3 py-2 text-right">Bunga %</th>
                  <th className="px-3 py-2 text-right">Tenor</th>
                  <th className="px-3 py-2 text-right">Angsuran/bln</th>
                  <th className="px-3 py-2 text-right">Sisa</th>
                  <th className="px-3 py-2">Cicilan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {kreditFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-3 py-8 text-center text-slate-500">
                      Belum ada data kredit
                    </td>
                  </tr>
                ) : (
                  kreditFiltered.map((k) => {
                    const ag = anggotaById(k.anggota_id);
                    return (
                      <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono text-xs">{k.no}</td>
                        <td className="px-3 py-2">{k.tgl_mulai || "—"}</td>
                        <td className="px-3 py-2">{ag?.nama || "—"}</td>
                        <td className="px-3 py-2">{ag?.nip || "—"}</td>
                        <td className="px-3 py-2">{k.jenis}</td>
                        <td className="px-3 py-2">{k.nama_barang || "—"}</td>
                        <td className="px-3 py-2">{k.toko || "—"}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(Number(k.harga_beli || 0))}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(Number(k.dp || 0))}</td>
                        <td className="px-3 py-2 text-right">{Number(k.bunga_pct || 0)}%</td>
                        <td className="px-3 py-2 text-right">{fmtNum(Number(k.tenor || 0))}</td>
                        <td className="px-3 py-2 text-right">{fmtRp(Number(k.angsuran_per_bulan || 0))}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmtRp(Number(k.sisa || 0))}</td>
                        <td className="px-3 py-2 text-slate-400">—</td>
                        <td className="px-3 py-2">{k.status || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AngsuranModal
        open={showAngsur}
        loading={actionLoading}
        onClose={() => {
          setShowAngsur(false);
          setSelectedPinjaman(null);
        }}
        onConfirm={async ({ tanggal, metode }) => {
          if (!selectedPinjaman) return;
          setActionLoading(true);
          try {
            await bayarAngsuran(selectedPinjaman.id, { tanggal, metode });
            setShowAngsur(false);
            setSelectedPinjaman(null);
            await load();
            setNotice({ tone: "ok", text: "Pembayaran angsuran berhasil." });
          } catch (e: unknown) {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Gagal";
            setNotice({ tone: "err", text: msg });
          } finally {
            setActionLoading(false);
          }
        }}
        pinjaman={selectedPinjaman ? { nomor: selectedPinjaman.no, angsuran: Number(selectedPinjaman.angsuran_per_bulan || 0) } : null}
      />
      <LunasDialog
        open={showLunas}
        loading={actionLoading}
        onClose={() => {
          setShowLunas(false);
          setSelectedPinjaman(null);
        }}
        onConfirm={async () => {
          if (!selectedPinjaman) return;
          setActionLoading(true);
          try {
            await lunasiPinjaman(selectedPinjaman.id);
            setShowLunas(false);
            setSelectedPinjaman(null);
            await load();
            setNotice({ tone: "ok", text: "Pinjaman dilunasi." });
          } catch (e: unknown) {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Gagal";
            setNotice({ tone: "err", text: msg });
          } finally {
            setActionLoading(false);
          }
        }}
        sisaPokok={selectedPinjaman ? Number(selectedPinjaman.sisa_pokok || 0) : 0}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "sky" | "emerald" | "amber" | "violet" | "rose" }) {
  const bg =
    tone === "sky"
      ? "bg-sky-50 border-sky-100"
      : tone === "emerald"
        ? "bg-emerald-50 border-emerald-100"
        : tone === "amber"
          ? "bg-amber-50 border-amber-100"
          : tone === "rose"
            ? "bg-rose-50 border-rose-100"
            : "bg-violet-50 border-violet-100";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${bg}`}>
      <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
    </div>
  );
}
