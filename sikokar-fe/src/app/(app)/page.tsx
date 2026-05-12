"use client";

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import ChartPlaceholder from "@/components/ChartPlaceholder";
import DataTable from "@/components/DataTable";
import { getUser } from "@/lib/auth";
import {
  listAnggota,
  listApproval,
  listPenjualan,
  listPinjaman,
  listSimpanan,
  type Approval,
  type Penjualan,
} from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function DashboardPage() {
  const user = getUser();
  const [members, setMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [savings, setSavings] = useState(0);
  const [savingsByType, setSavingsByType] = useState<Record<string, number>>({});
  const [loans, setLoans] = useState(0);
  const [outstandingLoans, setOutstandingLoans] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [transactions, setTransactions] = useState<Penjualan[]>([]);
  const [omzetToday, setOmzetToday] = useState(0);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [anggota, simpanan, pinjaman, penjualan, approval] = await Promise.all([
          listAnggota(),
          listSimpanan(),
          listPinjaman(),
          listPenjualan(),
          listApproval({ status: "pending" }),
        ]);
        if (!active) {
          return;
        }
        const memberRows = anggota.data;
        const activeCount = memberRows.filter((row) => row.status === 1 || row.status === "1").length;
        const simpananRows = simpanan.data;
        const pinjamanRows = pinjaman.data;
        const penjualanRows = penjualan.data;
        const pendingApprovals = approval.data;

        setMembers(memberRows.length);
        setActiveMembers(activeCount);
        setSavings(simpananRows.reduce((sum, row) => sum + Number(row.saldo || 0), 0));
        setSavingsByType(
          simpananRows.reduce<Record<string, number>>((acc, row) => {
            const key = row.jenis || "lainnya";
            acc[key] = (acc[key] || 0) + Number(row.saldo || 0);
            return acc;
          }, {})
        );
        setLoans(pinjamanRows.reduce((sum, row) => sum + Number(row.nominal_disetujui || 0), 0));
        const outstanding = pinjamanRows
          .filter((row) => row.status !== "lunas")
          .reduce((sum, row) => sum + Number(row.sisa_pokok || row.nominal_disetujui || 0), 0);
        setOutstandingLoans(outstanding);
        setActiveLoans(pinjamanRows.filter((row) => row.status !== "lunas").length);
        setTransactions(penjualanRows.slice(0, 5));
        const today = new Date().toDateString();
        const omzet = penjualanRows
          .filter((row) => row.tgl && new Date(row.tgl).toDateString() === today)
          .reduce((sum, row) => sum + Number(row.total || 0), 0);
        setOmzetToday(omzet);
        setApprovals(pendingApprovals);
      } catch (err) {
        if (!active) {
          return;
        }
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to load dashboard data";
        setError(message);
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

  const stats = useMemo(
    () => [
      {
        title: "Omzet Hari Ini",
        value: formatRupiah(omzetToday),
        note: "Toko/POS",
      },
      {
        title: "Outstanding Pinjaman",
        value: formatRupiah(outstandingLoans),
        note: `${activeLoans} aktif`,
      },
      {
        title: "Total Simpanan",
        value: formatRupiah(savings),
        note: `${Object.keys(savingsByType).length || 0} jenis`,
      },
      {
        title: "Anggota Aktif",
        value: activeMembers.toLocaleString("id-ID"),
        note: `${members} terdaftar`,
      },
      {
        title: "Piutang Toko",
        value: formatRupiah(0),
        note: "Belum tersedia",
      },
      {
        title: "Pending Approval",
        value: approvals.length.toString(),
        note: approvals.length ? "Perlu tindakan" : "Aman",
      },
      {
        title: "Rental Tersedia",
        value: "0/0",
        note: "Armada",
      },
    ],
    [
      omzetToday,
      outstandingLoans,
      activeLoans,
      savings,
      savingsByType,
      activeMembers,
      members,
      approvals.length,
    ]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dashboard
          </div>
          <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">
            Welcome back, {user?.username || "Administrator"}
          </h1>
          <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening today.</p>
        </div>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          ⬇️ Export Report
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.title}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{item.value}</div>
            <div className="mt-1 text-xs text-slate-500">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
        <PanelCard title="Financial Performance">
          <div className="flex items-center justify-end gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Income
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-200" /> Expenses
            </div>
          </div>
          <ChartPlaceholder />
        </PanelCard>
        <PanelCard title="Ringkasan Simpanan">
          <div className="space-y-3">
            {Object.keys(savingsByType).length === 0 ? (
              <div className="text-sm text-slate-400">Belum ada data simpanan.</div>
            ) : (
              Object.entries(savingsByType).map(([type, total]) => (
                <div key={type} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-700 capitalize">{type}</div>
                  <div className="text-sm font-semibold text-indigo-600">{formatRupiah(total)}</div>
                </div>
              ))
            )}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Transaksi Terkini"
        action={
          <a href="/feature/riwayat-transaksi" className="text-xs font-semibold text-indigo-600">
            Lihat Semua
          </a>
        }
      >
        <DataTable
          columns={[
            { key: "no", label: "Transaction ID", className: "w-40" },
            { key: "jenis", label: "Type" },
            {
              key: "total",
              label: "Amount",
              render: (row) => formatRupiah(Number(row.total || 0)),
              className: "text-indigo-700 font-semibold",
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {row.status}
                </span>
              ),
            },
            { key: "tgl", label: "Date" },
          ]}
          rows={transactions}
          emptyLabel={loading ? "Loading transactions..." : "No transactions yet"}
        />
      </PanelCard>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <PanelCard
          title="Approval Pending"
          action={
            <a href="/approvals" className="text-xs font-semibold text-indigo-600">
              Kelola Approval
            </a>
          }
        >
          <DataTable
            columns={[
              { key: "id", label: "ID", className: "w-24" },
              { key: "modul", label: "Modul" },
              { key: "status", label: "Status" },
              { key: "created_at", label: "Created" },
            ]}
            rows={approvals.slice(0, 4)}
            emptyLabel={loading ? "Loading approvals..." : "Tidak ada approval pending"}
          />
        </PanelCard>
        <PanelCard title="Catatan" >
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Piutang toko dan data rental belum tersedia dari backend. Akan otomatis terisi saat endpoint siap.
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
