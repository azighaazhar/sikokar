"use client";

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { createPosCheckout, listBarang, type Barang } from "@/lib/api";

type CartItem = {
  id: string;
  nama: string;
  harga: number;
  qty: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

const categories = ["Kebersihan", "Makanan", "Minuman"];

export default function PosPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    listBarang({ q: search || undefined, kategori: category || undefined })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [search, category]);

  const addToCart = (item: Barang) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.id === item.id);
      if (existing) {
        return prev.map((row) => (row.id === item.id ? { ...row, qty: row.qty + 1 } : row));
      }
      return [...prev, { id: item.id, nama: item.nama, harga: Number(item.harga_jual || 0), qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) => prev.map((row) => (row.id === id ? { ...row, qty } : row)));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, row) => sum + row.harga * row.qty, 0);
    const discount = Math.min(globalDiscount, subtotal);
    const ppn = (subtotal - discount) * 0.11;
    const total = subtotal - discount + ppn;
    return { subtotal, discount, ppn, total };
  }, [cart, globalDiscount]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return;
    }
    setProcessing(true);
    try {
      const now = new Date();
      await createPosCheckout({
        id: `TRX-${Date.now()}`,
        no: `TRX-${Date.now()}`,
        tgl: now.toISOString(),
        jenis: paymentMethod === "kredit" ? "piutang" : "cash",
        subtotal: totals.subtotal,
        diskon_total: totals.discount,
        ppn_total: totals.ppn,
        total: totals.total,
        items: cart.map((row, index) => ({
          id: `TRX-${now.getTime()}-${index + 1}`,
          barang_id: row.id,
          nama: row.nama,
          qty: row.qty,
          harga_jual_at: row.harga,
          subtotal: row.harga * row.qty,
        })),
      });
      setCart([]);
      setGlobalDiscount(0);
      window.alert("Transaksi berhasil. Silakan cetak struk.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Toko / POS</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Kasir Toko</h1>
        <p className="text-sm text-slate-500">Pilih produk dan proses pembayaran.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <PanelCard title="Pencarian Produk">
            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode barang / nama"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
              <div className="flex gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      category === item ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => setCategory("")}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Produk">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-400"
                >
                  <div className="text-sm font-semibold text-slate-900">{item.nama}</div>
                  <div className="text-xs text-slate-400">{item.kode}</div>
                  <div className="mt-3 text-sm font-semibold text-indigo-600">
                    {formatRupiah(Number(item.harga_jual || 0))}
                  </div>
                </button>
              ))}
              {items.length === 0 && <div className="text-sm text-slate-400">Produk tidak ditemukan.</div>}
            </div>
          </PanelCard>
        </div>

        <PanelCard title="Keranjang">
          <div className="flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
                Belum ada produk di keranjang.
              </div>
            ) : (
              cart.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{row.nama}</div>
                    <div className="text-xs text-slate-400">{formatRupiah(row.harga)}</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={row.qty}
                    onChange={(event) => updateQty(row.id, Number(event.target.value))}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                  />
                </div>
              ))
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatRupiah(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diskon</span>
                <span className="font-semibold text-slate-900">{formatRupiah(totals.discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">PPN (11%)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(totals.ppn)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total Bayar</span>
                <span>{formatRupiah(totals.total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diskon Global</label>
              <input
                type="number"
                value={globalDiscount}
                onChange={(event) => setGlobalDiscount(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="kredit">Kredit Anggota</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing ? "Memproses..." : "Proses & Cetak Struk"}
              </button>
              <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
                Batal
              </button>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
