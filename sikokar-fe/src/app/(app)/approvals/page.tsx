"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { listApproval, type Approval } from "@/lib/api";

export default function ApprovalsPage() {
  const [rows, setRows] = useState<Approval[]>([]);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    listApproval({ status: status || undefined })
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [status]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Approval</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Approval Pending</h1>
        <p className="text-sm text-slate-500">Tinjau permintaan yang menunggu persetujuan.</p>
      </div>

      <PanelCard title="Filter Approval">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Reset</button>
        </div>
      </PanelCard>

      <PanelCard title="Daftar Approval">
        <DataTable
          columns={[
            { key: "id", label: "ID", className: "w-24" },
            { key: "modul", label: "Modul" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Tanggal" },
            {
              key: "aksi",
              label: "Aksi",
              render: () => (
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <button className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600">Approve</button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-500">Reject</button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel="Tidak ada approval"
        />
      </PanelCard>
    </div>
  );
}
