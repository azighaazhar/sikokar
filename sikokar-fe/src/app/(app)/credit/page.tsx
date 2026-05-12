"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";

type CreditRow = {
  id: string;
  anggota: string;
  jenis: string;
  barang: string;
  toko: string;
  harga: number;
  dp: number;
  pokok: number;
  bunga: number;
  tenor: number;
  angsuran: number;
  sisa: number;
  status: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function CreditPage() {
  const [rows] = useState<CreditRow[]>([]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kredit Motor & Elektronik</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Kredit Motor & Elektronik</h1>
        <p className="text-sm text-slate-500">
          Anggota ingin beli motor/elektronik → koperasi bayar ke toko → anggota cicil ke koperasi dengan bunga ringan.
        </p>
      </div>

      <PanelCard title="Filter Kredit">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <option>Semua Jenis</option>
            <option>Motor</option>
            <option>Elektronik</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Lunas</option>
          </select>
          <input placeholder="Cari nama / no barang" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div className="flex gap-2">
            <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Search</button>
            <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Reset</button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Tambah Kredit"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah Kredit"}
          </button>
        }
      >
        {showForm ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input placeholder="Pilih anggota" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Jenis kredit" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Nama barang/kendaraan" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Toko/Dealer" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
                <option>Aktif</option>
                <option>Lunas</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <input placeholder="Harga Beli" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="DP" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Pinjaman Pokok" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Bunga %/bulan" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <input placeholder="Tenor (bulan)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Detail perhitungan: pokok, total bunga, total bayar, angsuran/bulan.
            </div>
            <input placeholder="Catatan (opsional)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Batal</button>
              <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Simpan</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Klik "Tambah Kredit" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="Daftar Kredit">
        <DataTable
          columns={[
            { key: "id", label: "No Kredit" },
            { key: "anggota", label: "Anggota" },
            { key: "jenis", label: "Jenis" },
            { key: "barang", label: "Barang/Kendaraan" },
            { key: "toko", label: "Toko" },
            {
              key: "harga",
              label: "Harga Beli",
              render: (row) => formatRupiah(row.harga),
            },
            {
              key: "angsuran",
              label: "Angsuran/Bln",
              render: (row) => formatRupiah(row.angsuran),
            },
            { key: "status", label: "Status" },
            {
              key: "aksi",
              label: "Aksi",
              render: () => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button className="rounded-full border border-slate-200 px-3 py-1">Angsur</button>
                  <button className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600">Lunas</button>
                  <button className="rounded-full border border-slate-200 px-3 py-1">Edit</button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Hapus</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel="Belum ada kredit"
        />
      </PanelCard>
    </div>
  );
}
