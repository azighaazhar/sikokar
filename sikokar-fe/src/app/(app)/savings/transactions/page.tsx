"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";

type SavingTransaction = {
  id: string;
  tanggal: string;
  anggota: string;
  jenis: string;
  tipe: string;
  nominal: number;
  metode: string;
  keterangan?: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function SavingsTransactionsPage() {
  const [rows, setRows] = useState<SavingTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    anggota: "",
    tipe: "setoran",
    jenis: "pokok",
    tanggal: "",
    nominal: "",
    metode: "tunai",
    keterangan: "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: SavingTransaction = {
      id: `TS${Date.now()}`,
      tanggal: formState.tanggal || new Date().toISOString().slice(0, 10),
      anggota: formState.anggota,
      jenis: formState.jenis,
      tipe: formState.tipe,
      nominal: Number(formState.nominal || 0),
      metode: formState.metode,
      keterangan: formState.keterangan || "-",
    };
    setRows((prev) => [payload, ...prev]);
    setShowForm(false);
    setFormState({
      anggota: "",
      tipe: "setoran",
      jenis: "pokok",
      tanggal: "",
      nominal: "",
      metode: "tunai",
      keterangan: "",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Transaksi Simpanan
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Riwayat Transaksi</h1>
        <p className="text-sm text-slate-500">Filter dan catat transaksi simpanan.</p>
      </div>

      <PanelCard title="Filter Transaksi">
        <div className="grid gap-3 md:grid-cols-4">
          <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <option value="">Semua</option>
            <option value="setoran">Setoran</option>
            <option value="penarikan">Penarikan</option>
          </select>
          <div className="flex gap-2">
            <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Filter</button>
            <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Reset</button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Transaksi Baru"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Transaksi Baru"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={formState.anggota}
              onChange={(event) => setFormState({ ...formState, anggota: event.target.value })}
              placeholder="Cari anggota (NIP/Nama/ID)"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.tipe}
              onChange={(event) => setFormState({ ...formState, tipe: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="setoran">Setoran</option>
              <option value="penarikan">Penarikan</option>
            </select>
            <select
              value={formState.jenis}
              onChange={(event) => setFormState({ ...formState, jenis: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="pokok">Pokok</option>
              <option value="wajib">Wajib</option>
              <option value="sukarela">Sukarela</option>
            </select>
            <input
              value={formState.tanggal}
              onChange={(event) => setFormState({ ...formState, tanggal: event.target.value })}
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.nominal}
              onChange={(event) => setFormState({ ...formState, nominal: event.target.value })}
              placeholder="Nominal"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.metode}
              onChange={(event) => setFormState({ ...formState, metode: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="potong_gaji">Potong Gaji</option>
            </select>
            <input
              value={formState.keterangan}
              onChange={(event) => setFormState({ ...formState, keterangan: event.target.value })}
              placeholder="Keterangan (opsional)"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
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
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik "Transaksi Baru" untuk mencatat transaksi.</div>
        )}
      </PanelCard>

      <PanelCard title="Daftar Transaksi">
        <DataTable
          columns={[
            { key: "id", label: "No TRX" },
            { key: "tanggal", label: "Tanggal" },
            { key: "anggota", label: "Anggota" },
            { key: "jenis", label: "Jenis" },
            { key: "tipe", label: "Tipe" },
            {
              key: "nominal",
              label: "Nominal",
              render: (row) => formatRupiah(row.nominal),
              className: "text-indigo-700 font-semibold",
            },
            { key: "metode", label: "Metode" },
            { key: "keterangan", label: "Keterangan" },
          ]}
          rows={rows}
          emptyLabel="Belum ada transaksi"
        />
      </PanelCard>
    </div>
  );
}
