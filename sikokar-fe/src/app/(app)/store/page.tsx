"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { listBarang, type Barang } from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function StorePage() {
  const [rows, setRows] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listBarang();
        if (active) {
          setRows(response.data);
        }
      } catch (err) {
        if (active) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to load store items";
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
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Store
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Store Inventory</h1>
        <p className="text-sm text-slate-500">Review items available for sale.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <PanelCard title="Store Items">
        <DataTable
          columns={[
            { key: "kode", label: "Code", className: "w-28" },
            { key: "nama", label: "Item" },
            { key: "kategori", label: "Category" },
            { key: "satuan", label: "Unit" },
            {
              key: "harga_jual",
              label: "Price",
              render: (row) => formatRupiah(Number(row.harga_jual || 0)),
              className: "text-indigo-700 font-semibold",
            },
            { key: "tipe", label: "Type" },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading items..." : "No items available"}
        />
      </PanelCard>
    </div>
  );
}
