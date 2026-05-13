/** Unduh CSV (UTF-8 BOM agar Excel membaca ID dengan benar). */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = "\ufeff";
  const esc = (cell: string | number) => {
    const s = String(cell ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tombol Excel: ekspor CSV yang dibuka Excel. */
export function downloadExcelCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  downloadCsv(filename.replace(/\.xlsx?$/i, "") + ".csv", headers, rows);
}

export function printReportHtml(title: string, innerHtml: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:16px;color:#111}
      table{border-collapse:collapse;width:100%;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#f4f4f5}
      h1{font-size:18px;margin:0 0 12px}
      .meta{color:#666;font-size:12px;margin-bottom:16px}
    </style></head><body>
    <h1>${title}</h1>
    <div class="meta">${new Date().toLocaleString("id-ID")}</div>
    ${innerHtml}
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
