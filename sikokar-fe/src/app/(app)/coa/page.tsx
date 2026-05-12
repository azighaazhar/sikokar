"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createCoa, listCoa, type Coa } from "@/lib/api";

const types = ["aset", "kewajiban", "ekuitas", "pendapatan", "beban"];

export default function CoaPage() {
  const [rows, setRows] = useState<Coa[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    kode: "",
    nama: "",
    tipe: "aset",
    level: "1",
    aktif: "1",
  });

  const loadData = async () => {
    const response = await listCoa({ tipe: typeFilter || undefined });
    const filtered = search
      ? response.data.filter(
          (row) => row.kode.toLowerCase().includes(search.toLowerCase()) || row.nama.toLowerCase().includes(search.toLowerCase())
        )
      : response.data;
    setRows(filtered);
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    await createCoa({
      id: `C${Date.now()}`,
      kode: formState.kode,
      nama: formState.nama,
      tipe: formState.tipe,
      level: Number(formState.level || 1),
      aktif: formState.aktif === "1" ? 1 : 0,
    });
    setShowForm(false);
    setFormState({ kode: "", nama: "", tipe: "aset", level: "1", aktif: "1" });
    setSaving(false);
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Chart of Account</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Chart of Account</h1>
        <p className="text-sm text-slate-500">Kelola akun keuangan koperasi.</p>
      </div>

      <PanelCard title="Pencarian COA">
        <div className="grid gap-3 md:grid-cols-[1.3fr_0.6fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode / nama akun"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Tipe</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white" onClick={loadData}>
              Search
            </button>
            <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600" onClick={() => setSearch("")}>
              Reset
            </button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Tambah COA"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah COA"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={formState.kode}
              onChange={(event) => setFormState({ ...formState, kode: event.target.value })}
              placeholder="Kode Akun"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={formState.nama}
              onChange={(event) => setFormState({ ...formState, nama: event.target.value })}
              placeholder="Nama Akun"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.tipe}
              onChange={(event) => setFormState({ ...formState, tipe: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={formState.level}
              onChange={(event) => setFormState({ ...formState, level: event.target.value })}
              placeholder="Level"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.aktif}
              onChange={(event) => setFormState({ ...formState, aktif: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="1">Aktif</option>
              <option value="0">Tidak Aktif</option>
            </select>
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
          <div className="text-sm text-slate-500">Klik "Tambah COA" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List COA">
        <DataTable
          columns={[
            { key: "kode", label: "Kode Akun" },
            { key: "nama", label: "Nama Akun" },
            { key: "tipe", label: "Tipe" },
            { key: "level", label: "Level" },
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
          emptyLabel="Belum ada COA"
        />
      </PanelCard>
    </div>
  );
}
