import React from "react";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: { tanggal: string; metode: string }) => void;
  pinjaman: { nomor: string; angsuran: number } | null;
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function AngsuranModal({ open, loading, onClose, onConfirm, pinjaman }: Props) {
  const [tanggal, setTanggal] = React.useState("");
  const [metode, setMetode] = React.useState("Tunai");

  React.useEffect(() => {
    if (open) {
      setTanggal(new Date().toISOString().slice(0, 10));
      setMetode("Tunai");
    }
  }, [open]);

  if (!open || !pinjaman) return null;

  const busy = Boolean(loading);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="angsuran-title">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Tutup"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="angsuran-title" className="pr-10 text-lg font-semibold text-slate-900">
          Bayar Angsuran
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">No pinjaman</label>
            <input
              value={pinjaman.nomor}
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-sky-950"
            />
          </div>

          <p className="text-sm text-slate-600">
            Jumlah angsuran:{" "}
            <span className="font-semibold text-emerald-600">{formatRp(pinjaman.angsuran)}</span>
          </p>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metode</label>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:opacity-60"
            >
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="Potong Gaji">Potong Gaji</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Batal
          </button>
          <button
            type="button"
            disabled={busy || !tanggal}
            onClick={() => onConfirm({ tanggal, metode })}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Memproses…" : "Konfirmasi Bayar"}
          </button>
        </div>
      </div>
    </div>
  );
}
