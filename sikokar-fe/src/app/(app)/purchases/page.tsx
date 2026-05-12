"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { listSupplier, type Supplier } from "@/lib/api";

type PurchaseRow = {
  id: string;
  tanggal: string;
  supplier: string;
  toko: string;
  total: number;
  status: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function PurchasesPage() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    listSupplier()
      .then((res) => setSuppliers(res.data))
      .catch(() => setSuppliers([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pembelian</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Pembelian Barang</h1>
        <p className="text-sm text-slate-500">Kelola pembelian dari supplier.</p>
      </div>

      <PanelCard title="Pencarian Pembelian">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <input placeholder="No Pembelian" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div className="flex gap-2">
            <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Search</button>
            <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Reset</button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Buat Pembelian"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Buat Pembelian"}
          </button>
        }
      >
        {showForm ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Pilih Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nama}
                  </option>
                ))}
              </select>
              <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Pilih Toko/Lokasi</option>
                <option value="Toko 1">Toko 1</option>
                <option value="Toko 2">Toko 2</option>
              </select>
              <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
                <option>Status Lunas</option>
                <option>Hutang</option>
              </select>
              <input placeholder="Catatan (opsional)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" />
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Detail barang pembelian akan ditambahkan di sini (tambah baris, qty, harga, subtotal).
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Batal</button>
              <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Simpan Pembelian</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Klik "Buat Pembelian" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List Pembelian">
        <DataTable
          columns={[
            { key: "id", label: "No Pembelian" },
            { key: "tanggal", label: "Tanggal" },
            { key: "supplier", label: "Supplier" },
            { key: "toko", label: "Toko" },
            {
              key: "total",
              label: "Total",
              render: (row) => formatRupiah(row.total),
              className: "text-indigo-700 font-semibold",
            },
            { key: "status", label: "Status" },
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
          emptyLabel="Belum ada pembelian"
        />
      </PanelCard>
    </div>
  );
}
