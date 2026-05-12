import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  className?: string;
  render?: (row: T) => ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  emptyLabel,
  onRowClick,
  getRowKey,
  isRowClickable,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => string | number;
  isRowClickable?: (row: T) => boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 ${column.className || ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                {emptyLabel || "No data"}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const clickable = Boolean(onRowClick && (isRowClickable ? isRowClickable(row) : true));
              return (
              <tr
                key={getRowKey ? getRowKey(row, index) : index}
                onClick={() => {
                  if (clickable) onRowClick?.(row);
                }}
                className={clickable ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50"}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.className || ""}`}>
                    {column.render ? column.render(row) : String((row as any)[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
