"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createSupplier, listSupplier, type Supplier } from "@/lib/api";

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    kode: "",
    nama: "",
    jenis: "regular",
    aktif: "1",
    npwp: "",
    is_pkp: false,
    alamat: "",
    telp: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSupplier({ q: search || undefined });
      setRows(response.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load suppliers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetFilters = () => {
    setSearch("");
    loadData();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createSupplier({
        id: `S${Date.now()}`,
        kode: formState.kode || null,
        nama: formState.nama,
        jenis: formState.jenis,
        aktif: formState.aktif === "1" ? 1 : 0,
        npwp: formState.npwp || null,
        is_pkp: formState.is_pkp,
        alamat: formState.alamat || null,
        telp: formState.telp || null,
      });
      setShowForm(false);
      setFormState({
        kode: "",
        nama: "",
        jenis: "regular",
        aktif: "1",
        npwp: "",
        is_pkp: false,
        alamat: "",
        telp: "",
      });
      loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menambah supplier";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Supplier
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Data Supplier</h1>
        <p className="text-sm text-slate-500">Kelola supplier reguler dan konsinyasi.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <PanelCard title="Pencarian Supplier">
        <div className="grid gap-4 md:grid-cols-[1.3fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / kode supplier"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
              onClick={loadData}
            >
              Search
            </button>
            <button
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Tambah Supplier"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah Supplier"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              value={formState.kode}
              onChange={(event) => setFormState({ ...formState, kode: event.target.value })}
              placeholder="Kode Supplier"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={formState.nama}
              onChange={(event) => setFormState({ ...formState, nama: event.target.value })}
              placeholder="Nama Supplier"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.jenis}
              onChange={(event) => setFormState({ ...formState, jenis: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="regular">Regular</option>
              <option value="konsinyasi">Konsinyasi</option>
            </select>
            <select
              value={formState.aktif}
              onChange={(event) => setFormState({ ...formState, aktif: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="1">Aktif</option>
              <option value="0">Tidak Aktif</option>
            </select>
            <input
              value={formState.npwp}
              onChange={(event) => setFormState({ ...formState, npwp: event.target.value })}
              placeholder="NPWP"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.is_pkp}
                onChange={(event) => setFormState({ ...formState, is_pkp: event.target.checked })}
              />
              Supplier PKP
            </label>
            <input
              value={formState.alamat}
              onChange={(event) => setFormState({ ...formState, alamat: event.target.value })}
              placeholder="Alamat"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.telp}
              onChange={(event) => setFormState({ ...formState, telp: event.target.value })}
              placeholder="No Telpon"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
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
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik "Tambah Supplier" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List Supplier">
        <DataTable
          columns={[
            { key: "kode", label: "Kode", className: "w-24" },
            { key: "nama", label: "Nama Supplier" },
            { key: "jenis", label: "Jenis" },
            {
              key: "is_pkp",
              label: "PKP",
              render: (row) => (row.is_pkp ? "PKP" : "Non PKP"),
            },
            { key: "npwp", label: "NPWP" },
            { key: "alamat", label: "Alamat" },
            { key: "telp", label: "Telpon" },
            {
              key: "aktif",
              label: "Status",
              render: (row) => (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {row.aktif === 1 || row.aktif === "1" ? "Aktif" : "Tidak Aktif"}
                </span>
              ),
            },
            {
              key: "aksi",
              label: "Aksi",
              render: () => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button className="rounded-full border border-slate-200 px-3 py-1">Edit</button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Hapus</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading suppliers..." : "No suppliers available"}
        />
      </PanelCard>
    </div>
  );
}
