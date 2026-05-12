"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import { createKredit, listAnggota, listKredit, type Anggota, type Kredit } from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const jenisLabel = (j: string) => {
  if (j === "elektronik") return "Elektronik";
  return "Kendaraan";
};

const computeAngsuran = (pokok: number, tenor: number, bungaPct: number) => {
  const n = Number(pokok) || 0;
  const t = Number(tenor) || 1;
  const b = Number(bungaPct) || 0;
  const totalBunga = (n * b * t) / 100;
  const totalBayar = n + totalBunga;
  return t > 0 ? totalBayar / t : 0;
};

export default function CreditPage() {
  const [rows, setRows] = useState<Kredit[]>([]);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [namaInput, setNamaInput] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [formState, setFormState] = useState({
    jenis: "kendaraan" as "kendaraan" | "elektronik",
    nama_barang: "",
    toko: "",
    tgl_mulai: "",
    harga_beli: "",
    dp: "",
    pokok: "",
    bunga_pct: "1.5",
    tenor: "12",
    catatan: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, a] = await Promise.all([
        listKredit(statusFilter ? { status: statusFilter } : undefined),
        listAnggota(),
      ]);
      setRows(k.data);
      setAnggotaList(a.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memuat kredit";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const anggotaMap = useMemo(() => {
    return anggotaList.reduce<Record<string, Anggota>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [anggotaList]);

  const rowsByJenis = useMemo(() => {
    if (!jenisFilter) return rows;
    return rows.filter((row) => {
      const j = String(row.jenis || "");
      if (jenisFilter === "elektronik") return j === "elektronik";
      if (jenisFilter === "kendaraan") return j === "kendaraan" || j === "motor";
      if (jenisFilter === "motor") return j === "motor";
      return true;
    });
  }, [rows, jenisFilter]);

  const suggestions = useMemo(() => {
    const q = namaInput.trim().toLowerCase();
    if (q.length < 1) return [];
    return anggotaList
      .filter((a) => a.nama.toLowerCase().includes(q))
      .slice(0, 12);
  }, [namaInput, anggotaList]);

  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rowsByJenis;
    return rowsByJenis.filter((r) => {
      const nama = anggotaMap[r.anggota_id]?.nama?.toLowerCase() || "";
      const nb = (r.nama_barang || "").toLowerCase();
      const no = (r.no || "").toLowerCase();
      return nama.includes(q) || nb.includes(q) || no.includes(q);
    });
  }, [rowsByJenis, search, anggotaMap]);

  const pickAnggota = (a: Anggota) => {
    setNamaInput(a.nama);
    setShowSuggest(false);
  };

  const resolveAnggotaId = (): { id: string | null; error?: string } => {
    const q = namaInput.trim().toLowerCase();
    const exact = anggotaList.filter((a) => a.nama.trim().toLowerCase() === q);
    if (exact.length === 0) {
      return {
        id: null,
        error: "Nama tidak cocok dengan anggota terdaftar. Gunakan ejaan persis seperti di master anggota.",
      };
    }
    if (exact.length > 1) {
      return {
        id: null,
        error:
          "Lebih dari satu anggota memiliki nama identik. Sesuaikan nama di master anggota agar unik, atau hubungi pengurus.",
      };
    }
    return { id: exact[0].id };
  };

  const handleDpChange = (raw: string) => {
    const dpNum = Number(raw.replace(/\D/g, "")) || 0;
    const half = Math.round(dpNum / 2);
    setFormState((prev) => ({
      ...prev,
      dp: raw,
      pokok: raw === "" ? "" : String(half),
    }));
  };

  const previewAngsuran = useMemo(() => {
    return computeAngsuran(
      Number(formState.pokok || 0),
      Number(formState.tenor || 0) || 1,
      Number(formState.bunga_pct || 0)
    );
  }, [formState.pokok, formState.tenor, formState.bunga_pct]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { id: anggotaId, error: resolveErr } = resolveAnggotaId();
    if (!anggotaId) {
      setError(resolveErr || "Anggota tidak valid.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const id = `K${Date.now()}`;
      const no = `KR-${Date.now()}`;
      await createKredit({
        id,
        no,
        anggota_id: anggotaId,
        jenis: formState.jenis,
        nama_barang: formState.nama_barang || null,
        toko: formState.toko || null,
        tgl_mulai: formState.tgl_mulai || null,
        harga_beli: formState.harga_beli ? Number(formState.harga_beli) : 0,
        dp: formState.dp ? Number(formState.dp) : 0,
        pokok: formState.pokok ? Number(formState.pokok) : 0,
        bunga_pct: formState.bunga_pct ? Number(formState.bunga_pct) : 0,
        tenor: formState.tenor ? Number(formState.tenor) : 0,
        catatan: formState.catatan || null,
      });
      setShowForm(false);
      setNamaInput("");
      setFormState({
        jenis: "kendaraan",
        nama_barang: "",
        toko: "",
        tgl_mulai: "",
        harga_beli: "",
        dp: "",
        pokok: "",
        bunga_pct: "1.5",
        tenor: "12",
        catatan: "",
      });
      await load();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menyimpan kredit";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kredit Motor & Elektronik</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Kredit Motor & Elektronik</h1>
        <p className="text-sm text-slate-500">
          Pengajuan kredit masuk status menunggu persetujuan. Setujui atau tolak di halaman Approval.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      <PanelCard title="Filter Kredit">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
          >
            <option value="">Semua jenis</option>
            <option value="kendaraan">Kendaraan</option>
            <option value="elektronik">Elektronik</option>
            <option value="motor">Motor (data lama)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
          >
            <option value="">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="aktif">Aktif</option>
            <option value="lunas">Lunas</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota / barang / no"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={() => {
                setJenisFilter("");
                setStatusFilter("");
                setSearch("");
              }}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Reset
            </button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Tambah Kredit"
        action={
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah Kredit"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nama anggota (sesuai database)</label>
                <input
                  required
                  autoComplete="off"
                  value={namaInput}
                  onChange={(e) => {
                    setNamaInput(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                  placeholder="Ketik nama persis seperti di daftar anggota"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
                {showSuggest && suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                    {suggestions.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickAnggota(a)}
                        >
                          {a.nama} <span className="text-slate-400">({a.no})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Jenis kredit</label>
                <select
                  value={formState.jenis}
                  onChange={(e) =>
                    setFormState({ ...formState, jenis: e.target.value as "kendaraan" | "elektronik" })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                >
                  <option value="kendaraan">Kendaraan</option>
                  <option value="elektronik">Elektronik</option>
                </select>
              </div>
              <input
                value={formState.nama_barang}
                onChange={(e) => setFormState({ ...formState, nama_barang: e.target.value })}
                placeholder="Nama barang / kendaraan"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                value={formState.toko}
                onChange={(e) => setFormState({ ...formState, toko: e.target.value })}
                placeholder="Toko / dealer"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                value={formState.tgl_mulai}
                onChange={(e) => setFormState({ ...formState, tgl_mulai: e.target.value })}
                type="date"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={formState.harga_beli}
                onChange={(e) => setFormState({ ...formState, harga_beli: e.target.value })}
                placeholder="Harga beli"
                type="number"
                min={0}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                value={formState.dp}
                onChange={(e) => handleDpChange(e.target.value)}
                placeholder="DP"
                type="number"
                min={0}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                readOnly
                value={formState.pokok}
                placeholder="Pinjaman pokok (otomatis ½ DP)"
                type="number"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formState.bunga_pct}
                onChange={(e) => setFormState({ ...formState, bunga_pct: e.target.value })}
                placeholder="Bunga % / bulan"
                type="number"
                step="0.01"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input
                value={formState.tenor}
                onChange={(e) => setFormState({ ...formState, tenor: e.target.value })}
                placeholder="Tenor (bulan)"
                type="number"
                min={1}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
              Estimasi angsuran per bulan: <span className="font-semibold text-slate-900">{formatRupiah(previewAngsuran)}</span>{" "}
              (dari pokok setelah disetujui).
            </div>
            <input
              value={formState.catatan}
              onChange={(e) => setFormState({ ...formState, catatan: e.target.value })}
              placeholder="Catatan (opsional)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Menyimpan…" : "Kirim pengajuan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik &quot;Tambah Kredit&quot; untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="Daftar Kredit">
        <DataTable
          columns={[
            { key: "no", label: "No kredit", className: "w-32" },
            {
              key: "anggota_id",
              label: "Anggota",
              render: (row) => {
                const ag = anggotaMap[row.anggota_id];
                return ag ? (
                  <div>
                    <div className="font-semibold text-slate-900">{ag.nama}</div>
                    <div className="text-xs text-slate-500">{ag.no}</div>
                  </div>
                ) : (
                  row.anggota_id
                );
              },
            },
            {
              key: "jenis",
              label: "Jenis",
              render: (row) => jenisLabel(String(row.jenis)),
            },
            { key: "nama_barang", label: "Barang" },
            { key: "toko", label: "Toko" },
            {
              key: "harga_beli",
              label: "Harga beli",
              render: (row) => formatRupiah(Number(row.harga_beli || 0)),
            },
            {
              key: "dp",
              label: "DP",
              render: (row) => formatRupiah(Number(row.dp || 0)),
            },
            {
              key: "pokok",
              label: "Pokok",
              render: (row) => formatRupiah(Number(row.pokok || 0)),
            },
            {
              key: "angsuran_per_bulan",
              label: "Angsuran/bln",
              render: (row) => formatRupiah(Number(row.angsuran_per_bulan || 0)),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {row.status}
                </span>
              ),
            },
          ]}
          rows={displayRows}
          emptyLabel={loading ? "Memuat…" : "Belum ada kredit"}
        />
      </PanelCard>
    </div>
  );
}
