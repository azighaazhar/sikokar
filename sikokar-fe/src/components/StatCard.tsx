export default function StatCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
}) {
  const positive = !change.startsWith("-");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <span>{icon}</span>
        </div>
        <div
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          {change}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </div>
        <div className="text-lg font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
