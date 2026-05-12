const actions = [
  {
    title: "Add Member",
    description: "Register a new cooperative member",
    icon: "👥",
  },
  {
    title: "Deposit",
    description: "Add funds to member savings",
    icon: "🏦",
  },
  {
    title: "New Loan",
    description: "Start a new loan application",
    icon: "💳",
  },
];

export default function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      {actions.map((item) => (
        <div
          key={item.title}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            {item.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
            <div className="text-xs text-slate-500">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
