"use client";


import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import AngsuranModal from "@/components/AngsuranModal";
import LunasDialog from "@/components/LunasDialog";
import { createPinjaman, listPinjaman, listAnggota, type Pinjaman, type Anggota, type CreatePinjamanResult } from "@/lib/api";
import { bayarAngsuran, lunasiPinjaman } from "@/lib/loan-actions";

const LOAN_CAP_BY_ROLE = { manager: 50_000_000, hrd: 30_000_000, staff: 10_000_000 };

const resolveLoanCapFromJabatan = (jabatan?: string | null) => {
  const j = String(jabatan || "")
    .toLowerCase()
    .trim();
  if (j === "manager" || j.includes("manager")) return LOAN_CAP_BY_ROLE.manager;
  if (j === "hrd" || j.includes("hrd") || j.includes("human resource")) return LOAN_CAP_BY_ROLE.hrd;
  return LOAN_CAP_BY_ROLE.staff;
};

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

const sumUsedLimitForMember = (memberLoans: Pinjaman[]) =>
  memberLoans.reduce((sum, row) => {
    if (row.status === "aktif") {
      return sum + Number(row.sisa_pokok || row.nominal_disetujui || row.nominal_pengajuan || 0);
    }
    if (row.status === "pending") {
      return sum + Number(row.nominal_pengajuan || 0);
    }
    return sum;
  }, 0);

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function LoansPage() {
  const [rows, setRows] = useState<Pinjaman[]>([]);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    anggota_id: "",
    jenis: "regular",
    nominal_pengajuan: "",
    tenor: "12",
    tgl_pengajuan: "",
    tgl_cair: "",
  });

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [submitNotice, setSubmitNotice] = useState<{ tone: "ok" | "warn" | "err"; text: string } | null>(null);
  const [showAngsur, setShowAngsur] = useState(false);
  const [showLunas, setShowLunas] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  /** Pinjaman aktif yang dipilih dari area form (pembayaran). */
  const [pembayaranPinjamanId, setPembayaranPinjamanId] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pinjRes, angRes] = await Promise.all([listPinjaman(), listAnggota()]);
        if (active) {
          setRows(pinjRes.data);
          setAnggotaList(angRes.data);
        }
      } catch (err) {
        if (active) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to load loans";
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [refreshNonce]);

  const displayRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const loanPreview = useMemo(() => {
    if (!formState.anggota_id) return null;
    const ag = anggotaList.find((a) => a.id === formState.anggota_id);
    if (!ag) return null;
    const plafon = resolveLoanCapFromJabatan(ag.jabatan);
    const memberLoans = rows.filter((r) => r.anggota_id === formState.anggota_id);
    const frekuensi = memberLoans.length;
    const terpakai = sumUsedLimitForMember(memberLoans);
    const sisaLimit = Math.max(0, plafon - terpakai);
    const maxPengajuan = resolveMaxPengajuanAnggota(ag);
    return {
      plafon,
      terpakai,
      sisaLimit,
      frekuensi,
      maxPengajuan,
      jabatanLabel: ag.jabatan?.trim() || "Staff (default)",
    };
  }, [formState.anggota_id, anggotaList, rows]);

  const summary = useMemo(() => {
    const activeLoans = rows.filter((row) => row.status === "aktif" || row.status === "pending");
    const outstanding = activeLoans.reduce((sum, row) => {
      if (row.status === "aktif") {
        return sum + Number(row.sisa_pokok || row.nominal_disetujui || 0);
      }
      return sum + Number(row.nominal_pengajuan || 0);
    }, 0);
    const monthly = rows
      .filter((row) => row.status === "aktif")
      .reduce((sum, row) => sum + Number(row.angsuran_per_bulan || 0), 0);
    const activeCount = rows.filter((row) => row.status === "aktif").length;
    return { outstanding, monthly, activeCount };
  }, [rows]);

  const estimateAngsuran = useMemo(() => {
    const nominal = Number(formState.nominal_pengajuan || 0);
    const tenor = Number(formState.tenor || 0) || 1;
    const bunga = formState.jenis === "darurat" ? 1.0 : 1.5;
    const totalBunga = (nominal * bunga * tenor) / 100;
    const totalBayar = nominal + totalBunga;
    return totalBayar / tenor;
  }, [formState.jenis, formState.nominal_pengajuan, formState.tenor]);

  const pinjamanAktifList = useMemo(() => rows.filter((r) => r.status === "aktif"), [rows]);

  const pinjamanUntukPembayaranForm = useMemo(() => {
    if (!pembayaranPinjamanId) return null;
    return rows.find((r) => r.id === pembayaranPinjamanId && r.status === "aktif") ?? null;
  }, [rows, pembayaranPinjamanId]);

  useEffect(() => {
    if (!pembayaranPinjamanId) return;
    const row = rows.find((r) => r.id === pembayaranPinjamanId);
    if (!row || row.status !== "aktif") {
      setPembayaranPinjamanId("");
    }
  }, [rows, pembayaranPinjamanId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res: CreatePinjamanResult = await createPinjaman({
        id: `P${Date.now()}`,
        no: `PNJ-${Date.now()}`,
        anggota_id: formState.anggota_id,
        jenis: formState.jenis,
        nominal_pengajuan: Number(formState.nominal_pengajuan || 0),
        tenor: Number(formState.tenor || 12),
        bunga_pct: formState.jenis === "darurat" ? 1.0 : 1.5,
        angsuran_per_bulan: estimateAngsuran,
        tgl_pengajuan: formState.tgl_pengajuan || null,
        tgl_cair: formState.tgl_cair || null,
      });
      const reason = res.reason || "";
      const needsAttention =
        res.status === "ditolak" ||
        /melebihi|maks\.|merekomendasikan|Frekuensi data pinjaman/i.test(reason);
      const tone: "ok" | "warn" | "err" = res.status === "ditolak" ? "err" : needsAttention ? "warn" : "ok";
      setSubmitNotice({
        tone,
        text: [res.status?.toUpperCase(), reason].filter(Boolean).join(" — "),
      });
      setRefreshNonce((n) => n + 1);
      setShowForm(false);
      setFormState({
        anggota_id: "",
        jenis: "regular",
        nominal_pengajuan: "",
        tenor: "12",
        tgl_pengajuan: "",
        tgl_cair: "",
      });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal mengajukan pinjaman";
      setSubmitNotice({ tone: "err", text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pinjaman</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Monitoring Pinjaman</h1>
        <p className="text-sm text-slate-500">
          Plafon per jabatan: Manager Rp50jt, HRD Rp30jt, Staff Rp10jt. Frekuensi pengajuan mengikuti master anggota
          (default Manager 5×, lainnya 3×). Pengajuan selalu masuk status menunggu di Approval; jika plafon atau kuota
          terlampaui, sistem hanya menambahkan catatan — tidak ada penolakan otomatis dari server.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      {submitNotice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            submitNotice.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : submitNotice.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex justify-between gap-3">
            <span>{submitNotice.text}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => setSubmitNotice(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Outstanding</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{formatRupiah(summary.outstanding)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Angsuran / Bulan</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{formatRupiah(summary.monthly)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Pinjaman Aktif</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{summary.activeCount}</div>
        </div>
      </div>

      <PanelCard title="Filter Pinjaman">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="aktif">Aktif</option>
            <option value="lunas">Lunas</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Search</button>
          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600" onClick={() => setStatusFilter("")}>Reset</button>
        </div>
      </PanelCard>

      <PanelCard
        title="Form pinjaman"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup form pengajuan" : "Ajukan pinjaman baru"}
          </button>
        }
      >
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:p-5">
          <div className="text-sm font-semibold text-slate-900">Angsur &amp; lunas (pinjaman aktif)</div>
          <p className="mt-1 text-xs text-slate-500">
            Pilih pinjaman yang sudah cair, lalu catat pembayaran angsuran bulanan atau pelunasan penuh — sama seperti dari tabel di bawah.
          </p>
          {pinjamanAktifList.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Belum ada pinjaman berstatus aktif.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 md:items-end">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pinjaman</label>
                <select
                  value={pembayaranPinjamanId}
                  onChange={(e) => setPembayaranPinjamanId(e.target.value)}
                  className="mt-1 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Pilih no. pinjaman…</option>
                  {pinjamanAktifList.map((p) => {
                    const ag = anggotaList.find((a) => a.id === p.anggota_id);
                    const label = ag ? `${ag.nama} (${ag.no})` : p.anggota_id;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.no} — {label} · sisa {formatRupiah(Number(p.sisa_pokok || 0))}
                      </option>
                    );
                  })}
                </select>
              </div>
              {pinjamanUntukPembayaranForm && (
                <>
                  <div className="rounded-xl border border-white bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <div>
                      Angsuran / bln:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(Number(pinjamanUntukPembayaranForm.angsuran_per_bulan || 0))}
                      </span>
                    </div>
                    <div className="mt-1">
                      Sisa pokok:{" "}
                      <span className="font-semibold text-indigo-800">
                        {formatRupiah(Number(pinjamanUntukPembayaranForm.sisa_pokok || 0))}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={() => {
                        setSelectedPinjaman(pinjamanUntukPembayaranForm);
                        setShowAngsur(true);
                      }}
                    >
                      Angsur
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-sky-600 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        setSelectedPinjaman(pinjamanUntukPembayaranForm);
                        setShowLunas(true);
                      }}
                    >
                      Lunas
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
            {loanPreview && (
              <div className="md:col-span-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Ringkasan limit (anggota terpilih)</div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  <div>Jabatan / kelompok plafon: {loanPreview.jabatanLabel}</div>
                  <div>Plafon: {formatRupiah(loanPreview.plafon)}</div>
                  <div>Terpakai (pending + aktif): {formatRupiah(loanPreview.terpakai)}</div>
                  <div>Sisa limit: {formatRupiah(loanPreview.sisaLimit)}</div>
                  <div className="sm:col-span-2">
                    Frekuensi data pinjaman (total): {loanPreview.frekuensi} / {loanPreview.maxPengajuan} — jika
                    melebihi atau nominal di atas sisa plafon, halaman Approval menampilkan rekomendasi penolakan;
                    keputusan akhir oleh admin (bukan otomatis).
                  </div>
                </div>
              </div>
            )}
            <select
              required
              value={formState.anggota_id}
              onChange={(event) => setFormState({ ...formState, anggota_id: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Anggota</option>
              {anggotaList.map((anggota) => (
                <option key={anggota.id} value={anggota.id}>
                  {anggota.nama} ({anggota.no})
                  {anggota.jabatan ? ` — ${anggota.jabatan}` : ""}
                </option>
              ))}
            </select>
            <select
              value={formState.jenis}
              onChange={(event) => setFormState({ ...formState, jenis: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="regular">Regular (1.5%/bln)</option>
              <option value="darurat">Darurat (1.0%/bln)</option>
            </select>
            <input
              required
              value={formState.nominal_pengajuan}
              onChange={(event) => setFormState({ ...formState, nominal_pengajuan: event.target.value })}
              placeholder="Nominal (Rp)"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.tenor}
              onChange={(event) => setFormState({ ...formState, tenor: event.target.value })}
              placeholder="Tenor (bulan)"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.tgl_pengajuan}
              onChange={(event) => setFormState({ ...formState, tgl_pengajuan: event.target.value })}
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.tgl_cair}
              onChange={(event) => setFormState({ ...formState, tgl_cair: event.target.value })}
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 md:col-span-3">
              Estimasi angsuran/bulan: <span className="font-semibold text-slate-900">{formatRupiah(estimateAngsuran)}</span>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan Pengajuan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">
            Klik &quot;Ajukan pinjaman baru&quot; di pojok kanan atas kartu ini untuk membuka form pengajuan.
          </div>
        )}
      </PanelCard>

      <PanelCard title="List Pinjaman">
        <DataTable
          columns={[
            { key: "no", label: "Loan No", className: "w-32" },
            {
              key: "anggota_id",
              label: "Anggota",
              render: (row) => {
                const ag = anggotaList.find((a) => a.id === row.anggota_id);
                return ag ? (
                  <div>
                    <div className="font-semibold text-slate-900">{ag.nama}</div>
                    <div className="text-xs text-slate-500">{ag.no}</div>
                  </div>
                ) : (
                  row.anggota_id
                );
              },
            },
            { key: "jenis", label: "Type" },
            { key: "tgl_cair", label: "Tanggal Cair" },
            {
              key: "nominal_pengajuan",
              label: "Requested",
              render: (row) => formatRupiah(Number(row.nominal_pengajuan || 0)),
            },
            {
              key: "nominal_disetujui",
              label: "Approved",
              render: (row) => formatRupiah(Number(row.nominal_disetujui || 0)),
              className: "text-indigo-700 font-semibold",
            },
            {
              key: "bunga_pct",
              label: "Bunga",
              render: (row) => `${row.bunga_pct ?? 0}%`,
            },
            {
              key: "angsuran_per_bulan",
              label: "Angsuran/Bln",
              render: (row) => formatRupiah(Number(row.angsuran_per_bulan || 0)),
            },
            {
              key: "sisa_pokok",
              label: "Sisa Pokok",
              render: (row) => formatRupiah(Number(row.sisa_pokok || 0)),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => {
                const st = row.status;
                const cls =
                  st === "aktif"
                    ? "bg-emerald-50 text-emerald-700"
                    : st === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : st === "ditolak"
                        ? "bg-rose-50 text-rose-700"
                        : st === "lunas"
                          ? "bg-sky-50 text-sky-800"
                          : "bg-slate-50 text-slate-600";
                return (
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{st}</span>
                );
              },
            },
            {
              key: "aksi",
              label: "Aksi",
              render: (row) => {
                if (row.status === "pending") {
                  return (
                    <span className="text-xs font-medium text-amber-800">
                      Menunggu keputusan — gunakan menu Approval.
                    </span>
                  );
                }
                if (row.status === "ditolak") {
                  return <span className="text-xs text-slate-400">—</span>;
                }
                if (row.status === "lunas") {
                  return <span className="text-xs text-slate-500">Sudah lunas</span>;
                }
                if (row.status !== "aktif") {
                  return <span className="text-xs text-slate-400">—</span>;
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      onClick={() => {
                        setSelectedPinjaman(row);
                        setShowAngsur(true);
                      }}
                    >
                      Angsur
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-sky-600 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        setSelectedPinjaman(row);
                        setShowLunas(true);
                      }}
                    >
                      Lunas
                    </button>
                  </div>
                );
              },
            },
          ]}
          rows={displayRows}
          emptyLabel={loading ? "Loading loans..." : "No loans found"}
        />
      </PanelCard>

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
            const res = await bayarAngsuran(selectedPinjaman.id, { tanggal, metode });
            setShowAngsur(false);
            setSelectedPinjaman(null);
            setRefreshNonce((n) => n + 1);
            if (selectedPinjaman.id === pembayaranPinjamanId && res?.status === "lunas") {
              setPembayaranPinjamanId("");
            }
            setSubmitNotice({
              tone: "ok",
              text:
                res?.status === "lunas"
                  ? "Pembayaran angsuran berhasil; sisa pokok habis — pinjaman dilunasi."
                  : "Pembayaran angsuran berhasil.",
            });
          } catch (err: any) {
            setSubmitNotice({ tone: "err", text: err?.message || "Gagal membayar angsuran." });
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
            setRefreshNonce((n) => n + 1);
            if (selectedPinjaman.id === pembayaranPinjamanId) {
              setPembayaranPinjamanId("");
            }
            setSubmitNotice({ tone: "ok", text: "Pinjaman berhasil dilunasi." });
          } catch (err: any) {
            setSubmitNotice({ tone: "err", text: err?.message || "Gagal melunasi pinjaman." });
          } finally {
            setActionLoading(false);
          }
        }}
        sisaPokok={selectedPinjaman ? Number(selectedPinjaman.sisa_pokok || 0) : 0}
      />
    </div>
  );
}
