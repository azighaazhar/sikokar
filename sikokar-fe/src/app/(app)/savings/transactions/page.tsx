"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import {
  createSimpananTransaksi,
  listAnggota,
  listSimpanan,
  listSimpananTransaksi,
  type Anggota,
  type SimpananTransaksi,
} from "@/lib/api";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );

export default function SavingsTransactionsPage() {
  const [rows, setRows] = useState<SimpananTransaksi[]>([]);
  const [anggotaRows, setAnggotaRows] = useState<Anggota[]>([]);
  const [anggotaOptions, setAnggotaOptions] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [searchAnggota, setSearchAnggota] = useState("");
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
  const [saldo, setSaldo] = useState(0);
  const [saldoLoading, setSaldoLoading] = useState(false);
  const [formState, setFormState] = useState({
    anggota_id: "",
    tipe: "setoran",
    jenis: "pokok",
    tanggal: "",
    nominal: "",
    metode: "tunai",
    keterangan: "",
  });

  const anggotaMap = useMemo(() => {
    return anggotaRows.reduce<Record<string, Anggota>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [anggotaRows]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trxRes, anggotaRes] = await Promise.all([listSimpananTransaksi(), listAnggota()]);
      setRows(trxRes.data);
      setAnggotaRows(anggotaRes.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memuat transaksi";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchAnggota = async () => {
      if (searchAnggota.trim().length < 1) {
        setAnggotaOptions([]);
        return;
      }
      try {
        const response = await listAnggota({ q: searchAnggota.trim() });
        if (active) {
          setAnggotaOptions(response.data);
        }
      } catch {
        if (active) {
          setAnggotaOptions([]);
        }
      }
    };
    fetchAnggota();
    return () => {
      active = false;
    };
  }, [searchAnggota]);

  useEffect(() => {
    let active = true;
    const fetchSaldo = async () => {
      if (!formState.anggota_id || !formState.jenis) {
        setSaldo(0);
        return;
      }
      setSaldoLoading(true);
      try {
        const response = await listSimpanan({ anggota_id: formState.anggota_id, jenis: formState.jenis });
        if (!active) {
          return;
        }
        const row = response.data[0];
        setSaldo(Number(row?.saldo || 0));
      } catch {
        if (active) {
          setSaldo(0);
        }
      } finally {
        if (active) {
          setSaldoLoading(false);
        }
      }
    };
    fetchSaldo();
    return () => {
      active = false;
    };
  }, [formState.anggota_id, formState.jenis]);

  const nominalValue = Number(formState.nominal || 0);
  const penarikanBlocked = formState.tipe === "penarikan" && (saldo <= 0 || nominalValue > saldo);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createSimpananTransaksi({
        id: `ST${Date.now()}`,
        anggota_id: formState.anggota_id,
        jenis: formState.jenis,
        tipe: formState.tipe,
        tgl: formState.tanggal || new Date().toISOString().slice(0, 10),
        nominal: Number(formState.nominal || 0),
        metode: formState.metode,
        keterangan: formState.keterangan || null,
      });
      setShowForm(false);
      setSearchAnggota("");
      setSelectedAnggota(null);
      setAnggotaOptions([]);
      setFormState({
        anggota_id: "",
        tipe: "setoran",
        jenis: "pokok",
        tanggal: "",
        nominal: "",
        metode: "tunai",
        keterangan: "",
      });
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menyimpan transaksi";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Simpanan</div>
          <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Transaksi Simpanan</h1>
          <p className="text-sm text-slate-500">Catat setoran dan penarikan simpanan anggota.</p>
        </div>
        <a
          href="/savings"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          Kembali
        </a>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <PanelCard
        title="Transaksi Baru"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Transaksi Baru"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-3">
              <div className="relative">
                <input
                  value={searchAnggota}
                  onChange={(event) => {
                    setSearchAnggota(event.target.value);
                    setSelectedAnggota(null);
                    setFormState({ ...formState, anggota_id: "" });
                  }}
                  placeholder="Cari anggota (NIP/NIK/ID/Nama)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
                {anggotaOptions.length > 0 && !selectedAnggota && (
                  <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                    {anggotaOptions.map((anggota) => (
                      <button
                        key={anggota.id}
                        type="button"
                        onClick={() => {
                          setSelectedAnggota(anggota);
                          setSearchAnggota(anggota.nama);
                          setFormState({ ...formState, anggota_id: anggota.id });
                          setAnggotaOptions([]);
                        }}
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span className="font-semibold text-slate-900">{anggota.nama}</span>
                        <span className="text-xs text-slate-500">
                          {anggota.id} · {anggota.nip || anggota.nik || "-"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedAnggota && (
                <div className="text-xs text-slate-500">
                  Dipilih: {selectedAnggota.nama} ({selectedAnggota.id})
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, tipe: "setoran" })}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold ${
                    formState.tipe === "setoran" ? "bg-white text-slate-900 shadow" : "text-slate-500"
                  }`}
                >
                  Setoran
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, tipe: "penarikan" })}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold ${
                    formState.tipe === "penarikan" ? "bg-white text-slate-900 shadow" : "text-slate-500"
                  }`}
                >
                  Penarikan
                </button>
              </div>
              {penarikanBlocked && (
                <div className="text-xs text-rose-600">
                  Tidak bisa melakukan penarikan karena simpanan kurang dari jumlah penarikan.
                </div>
              )}
              {!penarikanBlocked && saldoLoading && (
                <div className="text-xs text-slate-500">Memuat saldo simpanan...</div>
              )}
            </div>
            <select
              value={formState.jenis}
              onChange={(event) => setFormState({ ...formState, jenis: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="pokok">Pokok</option>
              <option value="wajib">Wajib</option>
              <option value="sukarela">Sukarela</option>
            </select>
            <input
              value={formState.tanggal}
              onChange={(event) => setFormState({ ...formState, tanggal: event.target.value })}
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.nominal}
              onChange={(event) => setFormState({ ...formState, nominal: event.target.value })}
              placeholder="Nominal"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.metode}
              onChange={(event) => setFormState({ ...formState, metode: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="potong_gaji">Potong Gaji</option>
            </select>
            <input
              value={formState.keterangan}
              onChange={(event) => setFormState({ ...formState, keterangan: event.target.value })}
              placeholder="Keterangan (opsional)"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
            />
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || !formState.anggota_id || penarikanBlocked}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik "Transaksi Baru" untuk mencatat transaksi.</div>
        )}
      </PanelCard>

      <PanelCard title="Daftar Transaksi">
        <DataTable
          columns={[
            { key: "id", label: "No TRX" },
            { key: "tgl", label: "Tanggal" },
            {
              key: "anggota_id",
              label: "Anggota",
              render: (row) => anggotaMap[row.anggota_id]?.nama || row.anggota_id,
            },
            { key: "jenis", label: "Jenis" },
            { key: "tipe", label: "Tipe" },
            {
              key: "nominal",
              label: "Nominal",
              render: (row) => formatRupiah(Number(row.nominal || 0)),
              className: "text-indigo-700 font-semibold",
            },
            { key: "metode", label: "Metode" },
            { key: "keterangan", label: "Keterangan" },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading transactions..." : "Belum ada transaksi"}
        />
      </PanelCard>
    </div>
  );
}
