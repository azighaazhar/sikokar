"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createRentalAsset } from "@/lib/api";

type RentalRow = {
  id: string;
  mulai: string;
  selesai: string;
  aset: string;
  kategori: string;
  penyewa: string;
  tipe_harga: string;
  total: number;
  status: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function RentalPage() {
  const [rows] = useState<RentalRow[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [showAsset, setShowAsset] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    kode: "",
    nama: "",
    kategori: "",
    tarif_harian: "",
    tarif_bulanan: "",
    kapasitas: "",
    nopol: "",
    status: "tersedia",
  });
  const [assetError, setAssetError] = useState<string | null>(null);
  const categories = ["Kendaraan Roda 4", "Kendaraan Roda 2", "Alat Berat"];

  const handleAssetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAsset(true);
    setAssetError(null);
    try {
      await createRentalAsset({
        id: `RA${Date.now()}`,
        kode: assetForm.kode,
        nama: assetForm.nama,
        kategori: assetForm.kategori || null,
        tarif_harian: assetForm.tarif_harian ? Number(assetForm.tarif_harian) : 0,
        tarif_bulanan: assetForm.tarif_bulanan ? Number(assetForm.tarif_bulanan) : 0,
        kapasitas: assetForm.kapasitas ? Number(assetForm.kapasitas) : 0,
        nopol: assetForm.nopol || null,
        status: assetForm.status,
      });
      setAssetForm({
        kode: "",
        nama: "",
        kategori: "",
        tarif_harian: "",
        tarif_bulanan: "",
        kapasitas: "",
        nopol: "",
        status: "tersedia",
      });
      setShowAsset(false);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menyimpan aset";
      setAssetError(message);
    } finally {
      setSavingAsset(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pengelolaan Aset</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Pengelolaan Aset</h1>
        <p className="text-sm text-slate-500">Kelola data aset dan booking.</p>
      </div>

      <PanelCard
        title="Booking Rental"
        action={
          <button
            onClick={() => setShowBooking((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showBooking ? "Tutup Form" : "Booking"}
          </button>
        }
      >
        {showBooking ? (
          <div className="grid gap-3 md:grid-cols-3">
            <input placeholder="Pilih aset" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <input type="date" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <option>Harian</option>
              <option>Bulanan</option>
              <option>Custom</option>
            </select>
            <input placeholder="Tarif custom" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <select className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
              <option>Umum</option>
              <option>Karyawan/Anggota</option>
              <option>Perusahaan</option>
            </select>
            <input placeholder="Nama penyewa" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <input placeholder="Nama perusahaan" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <input placeholder="No HP" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <input placeholder="Keperluan / Keterangan" className="rounded-xl border border-slate-200 px-4 py-3 text-sm md:col-span-3" />
            <div className="md:col-span-3 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Batal</button>
              <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Simpan Booking</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Klik "Booking" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard
        title="Kelola Aset"
        action={
          <button
            onClick={() => setShowAsset((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showAsset ? "Tutup Form" : "Kelola Aset"}
          </button>
        }
      >
        {showAsset ? (
          <form onSubmit={handleAssetSubmit} className="grid gap-3 md:grid-cols-3">
            {assetError && (
              <div className="md:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {assetError}
              </div>
            )}
            <input
              required
              value={assetForm.kode}
              onChange={(event) => setAssetForm({ ...assetForm, kode: event.target.value })}
              placeholder="Kode Aset"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={assetForm.nama}
              onChange={(event) => setAssetForm({ ...assetForm, nama: event.target.value })}
              placeholder="Nama Aset"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={assetForm.kategori}
              onChange={(event) => setAssetForm({ ...assetForm, kategori: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={assetForm.tarif_harian}
              onChange={(event) => setAssetForm({ ...assetForm, tarif_harian: event.target.value })}
              placeholder="Tarif Harian"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={assetForm.tarif_bulanan}
              onChange={(event) => setAssetForm({ ...assetForm, tarif_bulanan: event.target.value })}
              placeholder="Tarif Bulanan"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={assetForm.kapasitas}
              onChange={(event) => setAssetForm({ ...assetForm, kapasitas: event.target.value })}
              placeholder="Kapasitas"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={assetForm.nopol}
              onChange={(event) => setAssetForm({ ...assetForm, nopol: event.target.value })}
              placeholder="Nopol/ID"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={assetForm.status}
              onChange={(event) => setAssetForm({ ...assetForm, status: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="tersedia">Tersedia</option>
              <option value="disewa">Disewa</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setAssetForm({
                    kode: "",
                    nama: "",
                    kategori: "",
                    tarif_harian: "",
                    tarif_bulanan: "",
                    kapasitas: "",
                    nopol: "",
                    status: "tersedia",
                  })
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={savingAsset}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {savingAsset ? "Menyimpan..." : "Simpan Aset"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik "Kelola Aset" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="Daftar Rental">
        <DataTable
          columns={[
            { key: "id", label: "No Rental" },
            { key: "mulai", label: "Tgl Mulai" },
            { key: "selesai", label: "Tgl Selesai" },
            { key: "aset", label: "Aset" },
            { key: "kategori", label: "Kategori" },
            { key: "penyewa", label: "Penyewa" },
            { key: "tipe_harga", label: "Tipe Harga" },
            {
              key: "total",
              label: "Total",
              render: (row) => formatRupiah(row.total),
            },
            { key: "status", label: "Status" },
            {
              key: "aksi",
              label: "Aksi",
              render: () => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button className="rounded-full border border-slate-200 px-3 py-1">Pengembalian</button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Hapus</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel="Belum ada rental"
        />
      </PanelCard>
    </div>
  );
}
