export default function PayrollCollectivePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kolektif Potong Gaji</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Kolektif Potong Gaji</h1>
        <p className="text-sm text-slate-500">Modul ini disiapkan untuk pengelolaan potongan gaji kolektif.</p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Placeholder untuk upload file potongan, daftar tagihan, dan approval kolektif.
      </div>
    </div>
  );
}
