"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { listAnggota, listSimpanan, type Anggota, type Simpanan } from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function SavingsPage() {
  const [rows, setRows] = useState<Simpanan[]>([]);
  const [anggotaRows, setAnggotaRows] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [simpananRes, anggotaRes] = await Promise.all([listSimpanan(), listAnggota()]);
        if (active) {
          setRows(simpananRes.data);
          setAnggotaRows(anggotaRes.data);
        }
      } catch (err) {
        if (active) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "Failed to load savings";
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

  const anggotaMap = useMemo(() => {
    return anggotaRows.reduce<Record<string, Anggota>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [anggotaRows]);

  const totals = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + Number(row.saldo || 0), 0);
    const byType = rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.jenis || "lainnya";
      acc[key] = (acc[key] || 0) + Number(row.saldo || 0);
      return acc;
    }, {});
    return { total, byType };
  }, [rows]);

  const grouped = useMemo(() => {
    const map = new Map<string, { anggota_id: string; pokok: number; wajib: number; sukarela: number; total: number }>();
    rows.forEach((row) => {
      const entry = map.get(row.anggota_id) || {
        anggota_id: row.anggota_id,
        pokok: 0,
        wajib: 0,
        sukarela: 0,
        total: 0,
      };
      if (row.jenis === "pokok") {
        entry.pokok += Number(row.saldo || 0);
      } else if (row.jenis === "wajib") {
        entry.wajib += Number(row.saldo || 0);
      } else if (row.jenis === "sukarela") {
        entry.sukarela += Number(row.saldo || 0);
      }
      entry.total += Number(row.saldo || 0);
      map.set(row.anggota_id, entry);
    });
    const list = Array.from(map.values());
    if (!search) {
      return list;
    }
    const keyword = search.toLowerCase();
    return list.filter((row) => {
      const anggota = anggotaMap[row.anggota_id];
      const matches = [
        row.anggota_id,
        anggota?.no,
        anggota?.nip,
        anggota?.nik,
        anggota?.nama,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      return matches;
    });
  }, [rows, search, anggotaMap]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Simpanan</div>
          <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Simpanan Anggota</h1>
          <p className="text-sm text-slate-500">Ringkasan simpanan pokok, wajib, dan sukarela.</p>
        </div>
        <a
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          href="/savings/transactions"
        >
          Transaksi
        </a>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Simpanan</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{formatRupiah(totals.total)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Simpanan Pokok</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {formatRupiah(totals.byType.pokok || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Simpanan Wajib</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {formatRupiah(totals.byType.wajib || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Simpanan Sukarela</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {formatRupiah(totals.byType.sukarela || 0)}
          </div>
        </div>
      </div>

      <PanelCard title="Pencarian Simpanan">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / no / nip / nik / id"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Search</button>
          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600" onClick={() => setSearch("")}>Reset</button>
        </div>
      </PanelCard>

      <PanelCard title="List Simpanan">
        <DataTable
          columns={[
            {
              key: "anggota_id",
              label: "Anggota",
              render: (row) => {
                const anggota = anggotaMap[row.anggota_id];
                return anggota ? (
                  <div>
                    <div className="font-semibold text-slate-900">{anggota.nama}</div>
                    <div className="text-xs text-slate-500">{anggota.id}</div>
                  </div>
                ) : (
                  row.anggota_id
                );
              },
            },
            {
              key: "pokok",
              label: "Pokok",
              render: (row) => formatRupiah(row.pokok),
            },
            {
              key: "wajib",
              label: "Wajib",
              render: (row) => formatRupiah(row.wajib),
            },
            {
              key: "sukarela",
              label: "Sukarela",
              render: (row) => formatRupiah(row.sukarela),
            },
            {
              key: "total",
              label: "Total",
              render: (row) => formatRupiah(row.total),
              className: "text-indigo-700 font-semibold",
            },
          ]}
          rows={grouped}
          emptyLabel={loading ? "Loading savings..." : "No savings data"}
        />
      </PanelCard>
    </div>
  );
}
