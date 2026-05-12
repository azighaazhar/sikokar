const bars = [6, 9, 7, 11, 8, 12, 10];
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export default function ChartPlaceholder() {
  return (
    <div className="mt-2 flex h-48 items-end gap-4">
      {bars.map((height, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-xl bg-indigo-100">
            <div
              className="w-full rounded-xl bg-indigo-500"
              style={{ height: `${height * 12}px` }}
            />
          </div>
          <div className="text-[10px] font-medium text-slate-400">
            {labels[index]}
          </div>
        </div>
      ))}
    </div>
  );
}
