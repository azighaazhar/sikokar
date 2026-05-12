export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pengaturan</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Pengaturan</h1>
        <p className="text-sm text-slate-500">Kelola konfigurasi koperasi.</p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Placeholder pengaturan sistem, user, dan parameter aplikasi.
      </div>
    </div>
  );
}
