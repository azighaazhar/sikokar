"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createBarang, listBarang, listStok, listSupplier, updateBarang, type Barang, type Stok, type Supplier } from "@/lib/api";

const categories = ["Makanan", "Minuman", "Kebersihan", "Snack", "Lainnya"];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function InventoryPage() {
  const [rows, setRows] = useState<Barang[]>([]);
  const [stok, setStok] = useState<Stok[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    kode: "",
    nama: "",
    kategori: "",
    satuan: "pcs",
    harga_beli: "",
    harga_jual: "",
    tipe: "regular",
    supplier_id: "",
    is_taxable: false,
  });

  const stokMap = useMemo(() => {
    return stok.reduce<Record<string, number>>((acc, row) => {
      acc[row.barang_id] = (acc[row.barang_id] || 0) + Number(row.jumlah || 0);
      return acc;
    }, {});
  }, [stok]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [barangRes, stokRes, supplierRes] = await Promise.all([
        listBarang({ q: search, kategori: category || undefined }),
        listStok(),
        listSupplier(),
      ]);
      setRows(barangRes.data);
      setStok(stokRes.data);
      setSuppliers(supplierRes.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load inventory";
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
    setCategory("");
    loadData();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateBarang(editingId, {
          kode: formState.kode,
          nama: formState.nama,
          kategori: formState.kategori || null,
          satuan: formState.satuan || "pcs",
          harga_beli: formState.harga_beli ? Number(formState.harga_beli) : 0,
          harga_jual: formState.harga_jual ? Number(formState.harga_jual) : 0,
          tipe: formState.tipe,
          supplier_id: formState.supplier_id || null,
          is_taxable: formState.is_taxable,
        });
      } else {
        await createBarang({
          id: `B${Date.now()}`,
          kode: formState.kode,
          nama: formState.nama,
          kategori: formState.kategori || null,
          satuan: formState.satuan || "pcs",
          harga_beli: formState.harga_beli ? Number(formState.harga_beli) : 0,
          harga_jual: formState.harga_jual ? Number(formState.harga_jual) : 0,
          tipe: formState.tipe,
          supplier_id: formState.supplier_id || null,
          is_taxable: formState.is_taxable,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormState({
        kode: "",
        nama: "",
        kategori: "",
        satuan: "pcs",
        harga_beli: "",
        harga_jual: "",
        tipe: "regular",
        supplier_id: "",
        is_taxable: false,
      });
      loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menambah barang";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Barang & Stok
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Barang dan Stok</h1>
        <p className="text-sm text-slate-500">Cari, filter, dan kelola data barang.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <PanelCard title="Pencarian Barang">
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.6fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / kode barang"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Kategori</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
        title={editingId ? "Edit Barang" : "Tambah Barang"}
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : editingId ? "Edit Barang" : "Tambah Barang"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={formState.kode}
              onChange={(event) => setFormState({ ...formState, kode: event.target.value })}
              placeholder="Kode"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={formState.nama}
              onChange={(event) => setFormState({ ...formState, nama: event.target.value })}
              placeholder="Nama Barang"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.kategori}
              onChange={(event) => setFormState({ ...formState, kategori: event.target.value })}
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
              value={formState.satuan}
              onChange={(event) => setFormState({ ...formState, satuan: event.target.value })}
              placeholder="Satuan"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.harga_beli}
              onChange={(event) => setFormState({ ...formState, harga_beli: event.target.value })}
              placeholder="Harga Beli"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.harga_jual}
              onChange={(event) => setFormState({ ...formState, harga_jual: event.target.value })}
              placeholder="Harga Jual"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.tipe}
              onChange={(event) => setFormState({ ...formState, tipe: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="regular">Reguler</option>
              <option value="konsinyasi">Konsinyasi</option>
            </select>
            <select
              value={formState.supplier_id}
              onChange={(event) => setFormState({ ...formState, supplier_id: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.nama}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.is_taxable}
                onChange={(event) => setFormState({ ...formState, is_taxable: event.target.checked })}
              />
              Kena PPN
            </label>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
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
          <div className="text-sm text-slate-500">Klik "Tambah Barang" untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List Barang">
        <DataTable
          columns={[
            { key: "kode", label: "Kode", className: "w-28" },
            { key: "nama", label: "Nama Barang" },
            { key: "kategori", label: "Kategori" },
            { key: "satuan", label: "Satuan" },
            {
              key: "harga_beli",
              label: "Harga Beli",
              render: (row) => formatRupiah(Number(row.harga_beli || 0)),
            },
            {
              key: "harga_jual",
              label: "Harga Jual",
              render: (row) => formatRupiah(Number(row.harga_jual || 0)),
            },
            {
              key: "stok",
              label: "Stok",
              render: (row) => stokMap[row.id] ?? 0,
            },
            {
              key: "pajak",
              label: "Pajak",
              render: (row) => (row.is_taxable ? "PPN" : "-"),
            },
            {
              key: "aksi",
              label: "Aksi",
              render: (row) => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1"
                    onClick={() => {
                      setEditingId(row.id);
                      setFormState({
                        kode: row.kode,
                        nama: row.nama,
                        kategori: row.kategori || "",
                        satuan: row.satuan || "pcs",
                        harga_beli: row.harga_beli ? String(row.harga_beli) : "",
                        harga_jual: row.harga_jual ? String(row.harga_jual) : "",
                        tipe: row.tipe || "regular",
                        supplier_id: row.supplier_id || "",
                        is_taxable: Boolean(row.is_taxable),
                      });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Hapus</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading inventory..." : "No items available"}
        />
      </PanelCard>
    </div>
  );
}
