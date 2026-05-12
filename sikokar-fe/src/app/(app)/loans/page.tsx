"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createPinjaman, listPinjaman, listAnggota, type Pinjaman, type Anggota } from "@/lib/api";

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

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pinjRes, angRes] = await Promise.all([
          listPinjaman({ status: statusFilter || undefined }),
          listAnggota(),
        ]);
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
  }, [statusFilter]);

  const summary = useMemo(() => {
    const active = rows.filter((row) => row.status !== "lunas");
    const outstanding = active.reduce((sum, row) => sum + Number(row.sisa_pokok || row.nominal_disetujui || 0), 0);
    const monthly = active.reduce((sum, row) => sum + Number(row.angsuran_per_bulan || 0), 0);
    return { outstanding, monthly, activeCount: active.length };
  }, [rows]);

  const estimateAngsuran = useMemo(() => {
    const nominal = Number(formState.nominal_pengajuan || 0);
    const tenor = Number(formState.tenor || 0) || 1;
    const bunga = formState.jenis === "darurat" ? 1.0 : 1.5;
    const totalBunga = (nominal * bunga * tenor) / 100;
    const totalBayar = nominal + totalBunga;
    return totalBayar / tenor;
  }, [formState.jenis, formState.nominal_pengajuan, formState.tenor]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createPinjaman({
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
        status: "pending",
      });
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
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pinjaman</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Monitoring Pinjaman</h1>
        <p className="text-sm text-slate-500">Kelola pinjaman aktif dan pengajuan.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
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
            <option value="macet">Macet</option>
          </select>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Search</button>
          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600" onClick={() => setStatusFilter("")}>Reset</button>
        </div>
      </PanelCard>

      <PanelCard
        title="Ajukan Pinjaman"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Ajukan Pinjaman"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
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
          <div className="text-sm text-slate-500">Klik "Ajukan Pinjaman" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List Pinjaman">
        <DataTable
          columns={[
            { key: "no", label: "Loan No", className: "w-32" },
            { key: "anggota_id", label: "Member" },
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
              render: (row) => (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
                  {row.status}
                </span>
              ),
            },
            {
              key: "aksi",
              label: "Aksi",
              render: () => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button className="rounded-full border border-slate-200 px-3 py-1">Angsur</button>
                  <button className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600">Lunas</button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Hapus</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading loans..." : "No loans found"}
        />
      </PanelCard>
    </div>
  );
}
