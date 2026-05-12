"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import {
  listAnggota,
  listKredit,
  listPinjaman,
  updateKredit,
  updatePinjaman,
  type Anggota,
  type Kredit,
  type Pinjaman,
} from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const LOAN_CAP_BY_ROLE = { manager: 50_000_000, hrd: 30_000_000, staff: 10_000_000 };

/** Maks. data pinjaman per anggota: master `max_loans`, atau default dari jabatan (Manager 5, lainnya 3). */
const maxLoansForJabatan = (jabatan: string) => {
  const j = jabatan.trim().toLowerCase();
  if (j === "manager" || j.includes("manager")) return 5;
  return 3;
};

const resolveMaxPengajuanAnggota = (a: Anggota): number => {
  const stored = Number(a.max_loans);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return maxLoansForJabatan(String(a.jabatan || ""));
};

const resolveLoanCapFromJabatan = (jabatan?: string | null) => {
  const j = String(jabatan || "")
    .toLowerCase()
    .trim();
  if (j === "manager" || j.includes("manager")) return LOAN_CAP_BY_ROLE.manager;
  if (j === "hrd" || j.includes("hrd") || j.includes("human resource")) return LOAN_CAP_BY_ROLE.hrd;
  return LOAN_CAP_BY_ROLE.staff;
};

const sumUsedLimitPinjaman = (rows: Pinjaman[]) =>
  rows.reduce((sum, row) => {
    if (row.status === "aktif") {
      return sum + Number(row.sisa_pokok || row.nominal_disetujui || row.nominal_pengajuan || 0);
    }
    if (row.status === "pending") {
      return sum + Number(row.nominal_pengajuan || 0);
    }
    return sum;
  }, 0);

type PinjamanApprovalDetail = {
  plafonPinjaman: number;
  terpakaiPinjamanLain: number;
  sisaLimitPinjaman: number;
  nominalPengajuan: number;
  totalPinjamanSetelahSetuju: number;
  jumlahPinjamanAnggota: number;
  maxPengajuanAnggota: number;
  sisaBatasPengajuan: number;
  limitKreditAnggota: number;
  terpakaiKredit: number;
  sisaLimitKredit: number;
  kuotaPengajuanHabis: boolean;
  recommendation: "Setuju" | "Tolak";
  alasan: string[];
};

const computePinjamanApprovalDetail = (
  loan: Pinjaman,
  allPinjaman: Pinjaman[],
  allKredit: Kredit[],
  anggota: Anggota
): PinjamanApprovalDetail => {
  const plafonPinjaman = resolveLoanCapFromJabatan(anggota.jabatan);
  const others = allPinjaman.filter(
    (p) =>
      p.anggota_id === loan.anggota_id &&
      p.id !== loan.id &&
      (p.status === "pending" || p.status === "aktif")
  );
  const terpakaiPinjamanLain = sumUsedLimitPinjaman(others);
  const sisaLimitPinjaman = Math.max(0, plafonPinjaman - terpakaiPinjamanLain);
  const nominalPengajuan = Number(loan.nominal_pengajuan || 0);
  const totalPinjamanSetelahSetuju = terpakaiPinjamanLain + nominalPengajuan;

  const pinjamanAnggota = allPinjaman.filter((p) => p.anggota_id === loan.anggota_id);
  const jumlahPinjamanAnggota = pinjamanAnggota.length;
  const maxPengajuanAnggota = resolveMaxPengajuanAnggota(anggota);
  const sisaBatasPengajuan = Math.max(0, maxPengajuanAnggota - jumlahPinjamanAnggota);
  const kuotaPengajuanHabis = sisaBatasPengajuan <= 0;

  const limitKreditAnggota = Number(anggota.limit_kredit ?? 0) || 0;
  const kreditAnggota = allKredit.filter(
    (k) => k.anggota_id === loan.anggota_id && (k.status === "aktif" || k.status === "pending")
  );
  const terpakaiKredit = kreditAnggota.reduce((s, k) => s + Number(k.pokok || 0), 0);
  const sisaLimitKredit = Math.max(0, limitKreditAnggota - terpakaiKredit);

  const melebihiLimitPinjaman = nominalPengajuan > sisaLimitPinjaman || totalPinjamanSetelahSetuju > plafonPinjaman;
  const melebihiLimitKredit = limitKreditAnggota > 0 && terpakaiKredit > limitKreditAnggota;

  const alasan: string[] = [];
  let recommendation: "Setuju" | "Tolak";

  if (melebihiLimitPinjaman || melebihiLimitKredit) {
    recommendation = "Tolak";
    if (melebihiLimitPinjaman) {
      alasan.push(
        "Jumlah pinjaman setelah pengajuan ini melebihi total limit pinjaman berbasis jabatan, atau nominal melebihi sisa limit yang tersedia."
      );
    }
    if (melebihiLimitKredit) {
      alasan.push("Total pokok kredit barang (aktif/pending) melebihi limit kredit anggota.");
    }
  } else if (kuotaPengajuanHabis) {
    recommendation = "Setuju";
    alasan.push(
      `Batas frekuensi entri pinjaman (${maxPengajuanAnggota}× sesuai jabatan/master anggota) terlihat penuh, namun sisa limit pinjaman masih mencukupi nominal ini — rekomendasi tetap Setuju.`
    );
  } else {
    recommendation = "Setuju";
    alasan.push("Masih dalam batas limit pinjaman dan limit kredit barang tidak terlampaui.");
  }

  return {
    plafonPinjaman,
    terpakaiPinjamanLain,
    sisaLimitPinjaman,
    nominalPengajuan,
    totalPinjamanSetelahSetuju,
    jumlahPinjamanAnggota,
    maxPengajuanAnggota,
    sisaBatasPengajuan,
    limitKreditAnggota,
    terpakaiKredit,
    sisaLimitKredit,
    kuotaPengajuanHabis,
    recommendation,
    alasan,
  };
};

type QueueKind = "pinjaman" | "kredit_kendaraan" | "kredit_elektronik";

type QueueRow = {
  key: string;
  kind: QueueKind;
  refNo: string;
  tanggal: string;
  anggotaLabel: string;
  ringkasan: string;
  nominalTampil: number;
  status: string;
  entityId: string;
  canProcess: boolean;
};

const kreditQueueKind = (jenis: string): QueueKind =>
  jenis === "elektronik" ? "kredit_elektronik" : "kredit_kendaraan";

const kindLabel = (k: QueueKind) => {
  if (k === "pinjaman") return "Pinjaman";
  if (k === "kredit_kendaraan") return "Kredit kendaraan";
  return "Kredit elektronik";
};

export default function ApprovalsPage() {
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [pinjamanAll, setPinjamanAll] = useState<Pinjaman[]>([]);
  const [kreditAll, setKreditAll] = useState<Kredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [jenisFilter, setJenisFilter] = useState<string>("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [pinjamanDetail, setPinjamanDetail] = useState<{
    loan: Pinjaman;
    anggota: Anggota;
    detail: PinjamanApprovalDetail;
  } | null>(null);

  const anggotaMap = useMemo(() => {
    return anggota.reduce<Record<string, Anggota>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [anggota]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, p, k] = await Promise.all([listAnggota(), listPinjaman(), listKredit()]);
      setAnggota(a.data);
      setPinjamanAll(p.data);
      setKreditAll(k.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memuat data approval";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pinjamanFiltered = useMemo(() => {
    if (!statusFilter) return pinjamanAll;
    return pinjamanAll.filter((row) => row.status === statusFilter);
  }, [pinjamanAll, statusFilter]);

  const kreditFiltered = useMemo(() => {
    if (!statusFilter) return kreditAll;
    return kreditAll.filter((row) => (row.status || "") === statusFilter);
  }, [kreditAll, statusFilter]);

  const queueRows: QueueRow[] = useMemo(() => {
    const pinRows: QueueRow[] = pinjamanFiltered.map((row) => {
      const ag = anggotaMap[row.anggota_id];
      const canProcess = row.status === "pending";
      return {
        key: `pinjaman:${row.id}`,
        kind: "pinjaman",
        refNo: row.no,
        tanggal: row.tgl_pengajuan || "—",
        anggotaLabel: ag ? `${ag.nama} (${ag.no})` : row.anggota_id,
        ringkasan: `${row.jenis} · tenor ${row.tenor} bln · bunga ${row.bunga_pct ?? 0}%`,
        nominalTampil: Number(row.nominal_pengajuan || 0),
        status: row.status,
        entityId: row.id,
        canProcess,
      };
    });

    const kreditRows: QueueRow[] = kreditFiltered.map((row) => {
      const ag = anggotaMap[row.anggota_id];
      const canProcess = row.status === "pending";
      const kind = kreditQueueKind(String(row.jenis || ""));
      return {
        key: `kredit:${row.id}`,
        kind,
        refNo: row.no,
        tanggal: row.tgl_mulai || row.created_at?.slice(0, 10) || "—",
        anggotaLabel: ag ? `${ag.nama} (${ag.no})` : row.anggota_id,
        ringkasan: [row.nama_barang, row.toko].filter(Boolean).join(" · ") || "—",
        nominalTampil: Number(row.pokok || 0),
        status: row.status || "—",
        entityId: row.id,
        canProcess,
      };
    });

    const merged = [...pinRows, ...kreditRows];
    merged.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
    return merged;
  }, [pinjamanFiltered, kreditFiltered, anggotaMap]);

  const filteredRows = useMemo(() => {
    if (!jenisFilter) return queueRows;
    return queueRows.filter((r) => {
      if (jenisFilter === "pinjaman") return r.kind === "pinjaman";
      if (jenisFilter === "kendaraan") return r.kind === "kredit_kendaraan";
      if (jenisFilter === "elektronik") return r.kind === "kredit_elektronik";
      return true;
    });
  }, [queueRows, jenisFilter]);

  const openPinjamanDetail = (row: QueueRow) => {
    if (row.kind !== "pinjaman") return;
    const loan = pinjamanAll.find((p) => p.id === row.entityId);
    const ag = loan ? anggotaMap[loan.anggota_id] : undefined;
    if (!loan || !ag) return;
    const detail = computePinjamanApprovalDetail(loan, pinjamanAll, kreditAll, ag);
    setPinjamanDetail({ loan, anggota: ag, detail });
  };

  const handleDecision = async (row: QueueRow, decision: "aktif" | "ditolak") => {
    if (!row.canProcess) return;
    const label = decision === "aktif" ? "menyetujui" : "menolak";
    if (!window.confirm(`Lanjutkan ${label} permintaan ${row.refNo}?`)) return;
    setActingId(row.key);
    setError(null);
    try {
      if (row.kind === "pinjaman") {
        await updatePinjaman(row.entityId, { status: decision });
      } else {
        await updateKredit(row.entityId, { status: decision });
      }
      setPinjamanDetail(null);
      await load();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memproses";
      setError(message);
    } finally {
      setActingId(null);
    }
  };

  const resetFilters = () => {
    setStatusFilter("");
    setJenisFilter("");
  };

  const estAngsuran = (loan: Pinjaman) => {
    const n = Number(loan.nominal_pengajuan || 0);
    const t = Number(loan.tenor || 1) || 1;
    const b = Number(loan.bunga_pct || 0);
    const totalBunga = (n * b * t) / 100;
    return t > 0 ? (n + totalBunga) / t : 0;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Approval</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Persetujuan permintaan</h1>
        <p className="text-sm text-slate-500">
          Pinjaman tunai, kredit kendaraan, dan kredit elektronik. Persetujuan atau penolakan hanya dapat dilakukan di
          halaman ini. Klik baris pinjaman untuk detail limit dan rekomendasi.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      <PanelCard title="Filter">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Status data</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <option value="">Semua status</option>
              <option value="pending">Menunggu keputusan</option>
              <option value="aktif">Disetujui / aktif</option>
              <option value="ditolak">Ditolak</option>
              <option value="lunas">Lunas (kredit)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Jenis permintaan</label>
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
            >
              <option value="">Semua jenis (tabel)</option>
              <option value="pinjaman">Hanya pinjaman</option>
              <option value="kendaraan">Hanya kredit kendaraan</option>
              <option value="elektronik">Hanya kredit elektronik</option>
            </select>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Reset filter
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Muat ulang
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Filter status & jenis mempersempit tabel. Data limit untuk popup pinjaman selalu memakai seluruh riwayat
          pinjaman &amp; kredit di server.
        </p>
      </PanelCard>

      <PanelCard title="Antrian permintaan">
        <DataTable
          columns={[
            {
              key: "kind",
              label: "Jenis",
              render: (row: QueueRow) => <span className="font-semibold text-slate-800">{kindLabel(row.kind)}</span>,
            },
            { key: "refNo", label: "No. referensi", className: "w-36" },
            { key: "anggotaLabel", label: "Anggota" },
            { key: "ringkasan", label: "Ringkasan" },
            {
              key: "nominalTampil",
              label: "Nominal pokok / pengajuan",
              render: (row: QueueRow) => formatRupiah(row.nominalTampil),
              className: "text-indigo-700 font-semibold",
            },
            { key: "tanggal", label: "Tanggal", className: "w-28" },
            {
              key: "status",
              label: "Status",
              render: (row: QueueRow) => {
                const st = row.status;
                const cls =
                  st === "aktif"
                    ? "bg-emerald-50 text-emerald-700"
                    : st === "pending"
                      ? "bg-amber-50 text-amber-800"
                      : st === "ditolak"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-50 text-slate-600";
                return (
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{st}</span>
                );
              },
            },
            {
              key: "aksi",
              label: "Keputusan",
              render: (row: QueueRow) => {
                if (!row.canProcess) {
                  return <span className="text-xs text-slate-400">—</span>;
                }
                const busy = actingId === row.key;
                return (
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDecision(row, "aktif")}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                    >
                      Setujui
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDecision(row, "ditolak")}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                );
              },
            },
          ]}
          rows={filteredRows}
          emptyLabel={loading ? "Memuat…" : "Tidak ada data"}
          getRowKey={(row) => row.key}
          onRowClick={(row) => openPinjamanDetail(row)}
          isRowClickable={(row) => row.kind === "pinjaman"}
        />
        <p className="mt-2 text-xs text-slate-500">Baris jenis Pinjaman dapat diklik untuk melihat detail limit.</p>
      </PanelCard>

      {pinjamanDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pinjaman-detail-title"
          onClick={() => setPinjamanDetail(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="pinjaman-detail-title" className="text-lg font-semibold text-slate-900">
                  Detail pinjaman
                </h2>
                <p className="text-sm text-slate-500">{pinjamanDetail.loan.no}</p>
              </div>
              <button
                type="button"
                onClick={() => setPinjamanDetail(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                pinjamanDetail.detail.recommendation === "Setuju"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              Rekomendasi otomatis: {pinjamanDetail.detail.recommendation}
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Anggota</dt>
                <dd className="text-right font-medium text-slate-900">
                  {pinjamanDetail.anggota.nama}{" "}
                  <span className="text-slate-500">({pinjamanDetail.anggota.no})</span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Jabatan (plafon)</dt>
                <dd className="text-right text-slate-800">{pinjamanDetail.anggota.jabatan || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Total limit pinjaman</dt>
                <dd className="text-right font-semibold text-indigo-700">
                  {formatRupiah(pinjamanDetail.detail.plafonPinjaman)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Terpakai pinjaman lain (aktif/pending, excl. ini)</dt>
                <dd className="text-right">{formatRupiah(pinjamanDetail.detail.terpakaiPinjamanLain)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Sisa limit pinjaman (sebelum ini)</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {formatRupiah(pinjamanDetail.detail.sisaLimitPinjaman)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Nominal pengajuan</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {formatRupiah(pinjamanDetail.detail.nominalPengajuan)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Total pinjaman setelah disetujui</dt>
                <dd className="text-right">{formatRupiah(pinjamanDetail.detail.totalPinjamanSetelahSetuju)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">
                  Jumlah data pinjaman anggota
                  <span className="mt-0.5 block text-xs font-normal text-slate-400">
                    Maks. dari master anggota, atau default jabatan (Manager 5×, lainnya 3×).
                  </span>
                </dt>
                <dd className="text-right font-semibold text-slate-900">
                  {pinjamanDetail.detail.jumlahPinjamanAnggota} / {pinjamanDetail.detail.maxPengajuanAnggota}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Sisa slot pengajuan</dt>
                <dd className="text-right font-semibold">{pinjamanDetail.detail.sisaBatasPengajuan}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Limit kredit (anggota)</dt>
                <dd className="text-right">{formatRupiah(pinjamanDetail.detail.limitKreditAnggota)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Terpakai kredit (pokok aktif/pending)</dt>
                <dd className="text-right">{formatRupiah(pinjamanDetail.detail.terpakaiKredit)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Sisa limit kredit</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {formatRupiah(pinjamanDetail.detail.sisaLimitKredit)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Tenor / bunga</dt>
                <dd className="text-right">
                  {pinjamanDetail.loan.tenor} bln · {pinjamanDetail.loan.bunga_pct ?? 0}% / bln
                </dd>
              </div>
              <div className="flex justify-between gap-4 pb-2">
                <dt className="text-slate-500">Estimasi angsuran (jika disetujui)</dt>
                <dd className="text-right font-medium">{formatRupiah(estAngsuran(pinjamanDetail.loan))}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Dasar rekomendasi</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {pinjamanDetail.detail.alasan.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            {pinjamanDetail.loan.status === "pending" && (
              <div className="mt-4 flex flex-wrap justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={actingId !== null}
                  onClick={() =>
                    void handleDecision(
                      {
                        key: `pinjaman:${pinjamanDetail.loan.id}`,
                        kind: "pinjaman",
                        refNo: pinjamanDetail.loan.no,
                        tanggal: pinjamanDetail.loan.tgl_pengajuan || "—",
                        anggotaLabel: "",
                        ringkasan: "",
                        nominalTampil: 0,
                        status: pinjamanDetail.loan.status,
                        entityId: pinjamanDetail.loan.id,
                        canProcess: true,
                      },
                      "ditolak"
                    )
                  }
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  type="button"
                  disabled={actingId !== null}
                  onClick={() =>
                    void handleDecision(
                      {
                        key: `pinjaman:${pinjamanDetail.loan.id}`,
                        kind: "pinjaman",
                        refNo: pinjamanDetail.loan.no,
                        tanggal: pinjamanDetail.loan.tgl_pengajuan || "—",
                        anggotaLabel: "",
                        ringkasan: "",
                        nominalTampil: 0,
                        status: pinjamanDetail.loan.status,
                        entityId: pinjamanDetail.loan.id,
                        canProcess: true,
                      },
                      "aktif"
                    )
                  }
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
