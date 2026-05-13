import React from "react";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sisaPokok: number;
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function LunasDialog({ open, loading, onClose, onConfirm, sisaPokok }: Props) {
  if (!open) return null;
  const busy = Boolean(loading);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="lunas-title">
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

        <h2 id="lunas-title" className="pr-10 text-lg font-semibold text-slate-900">
          Pelunasan pinjaman
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Apakah Anda sudah yakin? Karena jika ini dilanjutkan maka pinjaman akan dianggap lunas.
        </p>

        {sisaPokok > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            Sisa pokok saat ini: <span className="font-semibold text-emerald-700">{formatRp(sisaPokok)}</span>
          </p>
        )}

        <div className="mt-8 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {busy ? "Memproses…" : "Ya, lunasi"}
          </button>
        </div>
      </div>
    </div>
  );
}
