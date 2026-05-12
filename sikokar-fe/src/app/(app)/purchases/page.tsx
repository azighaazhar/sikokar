"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { listBarang, listSupplier, createPembelian, type Supplier, type Barang } from "@/lib/api";

type PurchaseRow = {
  id: string;
  tanggal: string;
  supplier: string;
  toko: string;
  total: number;
  status: string;
};

type PurchaseItem = {
  barang_id: string;
  barang_nama: string;
  qty: string;
  harga_beli: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function PurchasesPage() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showManageBarang, setShowManageBarang] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [formState, setFormState] = useState({
    tgl: "",
    supplier_id: "",
    lokasi_id: "Lokasi 1",
    status: "lunas",
  });

  const [selectedBarang, setSelectedBarang] = useState("");
  const [selectedQty, setSelectedQty] = useState("");
  const [selectedHarga, setSelectedHarga] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [supplierRes, barangRes] = await Promise.all([
          listSupplier(),
          listBarang(),
        ]);
        setSuppliers(supplierRes.data);
        setBarangList(barangRes.data);
      } catch {
        setSuppliers([]);
        setBarangList([]);
      }
    };
    load();
  }, []);

  const handleAddBarang = () => {
    if (!selectedBarang || !selectedQty || !selectedHarga) {
      setError("Silakan lengkapi barang, qty, dan harga");
      return;
    }
    const barang = barangList.find((b) => b.id === selectedBarang);
    if (!barang) return;

    setPurchaseItems([
      ...purchaseItems,
      {
        barang_id: selectedBarang,
        barang_nama: barang.nama,
        qty: selectedQty,
        harga_beli: selectedHarga,
      },
    ]);

    setSelectedBarang("");
    setSelectedQty("");
    setSelectedHarga("");
    setError(null);
  };

  const handleRemoveBarang = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const totalPembelian = purchaseItems.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.harga_beli || 0),
    0
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.tgl || !formState.supplier_id || purchaseItems.length === 0) {
      setError("Silakan lengkapi tanggal, supplier, dan minimal ada 1 barang");
      return;
    }

    setSaving(true);
    try {
      await createPembelian({
        id: `PB${Date.now()}`,
        no: `PB-${Date.now()}`,
        tgl: formState.tgl,
        supplier_id: formState.supplier_id,
        lokasi_id: formState.lokasi_id,
        status: formState.status,
        total: totalPembelian,
        items: purchaseItems.map((item) => ({
          barang_id: item.barang_id,
          qty: Number(item.qty),
          harga_beli: Number(item.harga_beli),
          subtotal: Number(item.qty) * Number(item.harga_beli),
        })),
      });
      setShowForm(false);
      setPurchaseItems([]);
      setFormState({
        tgl: "",
        supplier_id: "",
        lokasi_id: "Lokasi 1",
        status: "lunas",
      });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menyimpan pembelian";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-4">
              <input
                required
                type="date"
                value={formState.tgl}
                onChange={(event) => setFormState({ ...formState, tgl: event.target.value })}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <select
                required
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
              <select
                value={formState.lokasi_id}
                onChange={(event) => setFormState({ ...formState, lokasi_id: event.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
              >
                <option value="Lokasi 1">Lokasi 1</option>
                <option value="Lokasi 2">Lokasi 2</option>
              </select>
              <select
                value={formState.status}
                onChange={(event) => setFormState({ ...formState, status: event.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
              >
                <option value="lunas">Lunas</option>
                <option value="hutang">Hutang</option>
              </select>
            </div>

            <PanelCard title="Kelola Barang Pembelian">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowManageBarang((prev) => !prev)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  {showManageBarang ? "Tutup" : "+ Tambah Barang"}
                </button>

                {showManageBarang && (
                  <div className="grid gap-3 md:grid-cols-4">
                    <select
                      value={selectedBarang}
                      onChange={(event) => {
                        setSelectedBarang(event.target.value);
                        const barang = barangList.find((b) => b.id === event.target.value);
                        setSelectedHarga(barang?.harga_beli?.toString() || "");
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
                    >
                      <option value="">Pilih Barang</option>
                      {barangList.map((barang) => (
                        <option key={barang.id} value={barang.id}>
                          {barang.nama}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={selectedQty}
                      onChange={(event) => setSelectedQty(event.target.value)}
                      placeholder="Qty"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                    <input
                      type="number"
                      value={selectedHarga}
                      onChange={(event) => setSelectedHarga(event.target.value)}
                      placeholder="Harga Beli"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddBarang}
                      className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Tambah
                    </button>
                  </div>
                )}

                {purchaseItems.length > 0 && (
                  <DataTable
                    columns={[
                      { key: "barang_nama", label: "Barang" },
                      { key: "qty", label: "Qty" },
                      { key: "harga_beli", label: "Harga Beli" },
                      {
                        key: "subtotal",
                        label: "Subtotal",
                        render: (item: any) =>
                          formatRupiah(Number(item.qty) * Number(item.harga_beli)),
                        className: "font-semibold text-indigo-700",
                      },
                      {
                        key: "aksi",
                        label: "Aksi",
                        render: (_: any, index: number) => (
                          <button
                            type="button"
                            onClick={() => handleRemoveBarang(index)}
                            className="text-xs font-semibold text-rose-600"
                          >
                            Hapus
                          </button>
                        ),
                      },
                    ]}
                    rows={purchaseItems as any}
                    emptyLabel="Belum ada barang"
                  />
                )}

                {purchaseItems.length > 0 && (
                  <div className="flex justify-end rounded-xl bg-slate-100 px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-600">Total Pembelian</div>
                      <div className="text-lg font-semibold text-slate-900">{formatRupiah(totalPembelian)}</div>
                    </div>
                  </div>
                )}
              </div>
            </PanelCard>

            <div className="flex justify-end gap-2">
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
                {saving ? "Menyimpan..." : "Simpan Pembelian"}
              </button>
            </div>
          </form>
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
