"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import {
  createAnggota,
  deleteAnggota,
  listAnggota,
  listKredit,
  listPinjaman,
  listSimpanan,
  updateAnggota,
  type Anggota,
  type Kredit,
  type Pinjaman,
  type Simpanan,
} from "@/lib/api";

const departments = ["Produksi", "HR", "Finance", "Warehouse", "Engineering"];
const positions = ["Manager", "Supervisor", "Koordinator", "Staff", "Asisten", "Driver", "Operator"];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function MembersPage() {
  const [rows, setRows] = useState<Anggota[]>([]);
  const [simpanan, setSimpanan] = useState<Simpanan[]>([]);
  const [pinjaman, setPinjaman] = useState<Pinjaman[]>([]);
  const [kredit, setKredit] = useState<Kredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    no: "",
    nama: "",
    nip: "",
    nik: "",
    no_hp: "",
    dept: "",
    jabatan: "",
    gaji: "",
    tgl_masuk: "",
    limit_kredit: "",
    limit_pinjaman: "",
    limit_darurat: "",
    max_loans: "",
    status: "1",
  });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editState, setEditState] = useState({
    no: "",
    nama: "",
    nip: "",
    nik: "",
    no_hp: "",
    dept: "",
    jabatan: "",
    gaji: "",
    tgl_masuk: "",
    limit_kredit: "",
    limit_pinjaman: "",
    limit_darurat: "",
    max_loans: "",
    status: "1",
  });
  const anggotaCountLabel = loading ? "Memuat data anggota..." : `${rows.length} anggota ditemukan`;

  const piutangMap = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of pinjaman) {
      if (p.status !== "aktif") continue;
      const id = p.anggota_id;
      acc[id] = (acc[id] || 0) + Number(p.sisa_pokok ?? p.nominal_disetujui ?? 0);
    }
    for (const k of kredit) {
      if (k.status !== "aktif") continue;
      const id = k.anggota_id;
      acc[id] = (acc[id] || 0) + Number(k.sisa ?? k.pokok ?? 0);
    }
    return acc;
  }, [pinjaman, kredit]);

  const simpananMap = useMemo(() => {
    return simpanan.reduce<Record<string, number>>((acc, row) => {
      acc[row.anggota_id] = (acc[row.anggota_id] || 0) + Number(row.saldo || 0);
      return acc;
    }, {});
  }, [simpanan]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [anggotaRes, simpananRes, pinjRes, kreditRes] = await Promise.all([
        listAnggota({ q: search, status: statusFilter || undefined }),
        listSimpanan(),
        listPinjaman(),
        listKredit(),
      ]);
      let data = anggotaRes.data;
      if (deptFilter) {
        data = data.filter((row) => row.dept === deptFilter);
      }
      setRows(data);
      setSimpanan(simpananRes.data);
      setPinjaman(pinjRes.data);
      setKredit(kreditRes.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load members";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDeptFilter("");
    loadData();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAnggota({
        id: `A${Date.now()}`,
        no: formState.no,
        nama: formState.nama,
        nip: formState.nip || null,
        nik: formState.nik || null,
        no_hp: formState.no_hp || null,
        dept: formState.dept || null,
        jabatan: formState.jabatan || null,
        gaji: formState.gaji ? Number(formState.gaji) : 0,
        tgl_masuk: formState.tgl_masuk || null,
        limit_kredit: formState.limit_kredit ? Number(formState.limit_kredit) : undefined,
        limit_pinjaman: formState.limit_pinjaman ? Number(formState.limit_pinjaman) : undefined,
        limit_darurat: formState.limit_darurat ? Number(formState.limit_darurat) : undefined,
        max_loans: formState.max_loans ? Number(formState.max_loans) : undefined,
        status: formState.status === "1" ? 1 : 0,
      });
      setShowForm(false);
      setFormState({
        no: "",
        nama: "",
        nip: "",
        nik: "",
        no_hp: "",
        dept: "",
        jabatan: "",
        gaji: "",
        tgl_masuk: "",
        limit_kredit: "",
        limit_pinjaman: "",
        limit_darurat: "",
        max_loans: "",
        status: "1",
      });
      loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menambah anggota";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row: Anggota) => {
    setEditingId(row.id);
    setEditState({
      no: row.no || "",
      nama: row.nama || "",
      nip: row.nip || "",
      nik: row.nik || "",
      no_hp: row.no_hp || "",
      dept: row.dept || "",
      jabatan: row.jabatan || "",
      gaji: row.gaji ? String(row.gaji) : "",
      tgl_masuk: row.tgl_masuk || "",
      limit_kredit: row.limit_kredit ? String(row.limit_kredit) : "",
      limit_pinjaman: row.limit_pinjaman ? String(row.limit_pinjaman) : "",
      limit_darurat: row.limit_darurat ? String(row.limit_darurat) : "",
      max_loans: row.max_loans ? String(row.max_loans) : "",
      status: row.status === 0 || row.status === "0" ? "0" : "1",
    });
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingId(null);
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setUpdating(true);
    try {
      await updateAnggota(editingId, {
        no: editState.no,
        nama: editState.nama,
        nip: editState.nip || null,
        nik: editState.nik || null,
        no_hp: editState.no_hp || null,
        dept: editState.dept || null,
        jabatan: editState.jabatan || null,
        gaji: editState.gaji ? Number(editState.gaji) : 0,
        tgl_masuk: editState.tgl_masuk || null,
        limit_kredit: editState.limit_kredit ? Number(editState.limit_kredit) : undefined,
        limit_pinjaman: editState.limit_pinjaman ? Number(editState.limit_pinjaman) : undefined,
        limit_darurat: editState.limit_darurat ? Number(editState.limit_darurat) : undefined,
        max_loans: editState.max_loans ? Number(editState.max_loans) : undefined,
        status: editState.status === "1" ? 1 : 0,
      });
      setShowEditForm(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memperbarui anggota";
      setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (row: Anggota) => {
    if (!window.confirm(`Hapus anggota ${row.nama}? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    try {
      await deleteAnggota(row.id);
      loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menghapus anggota";
      setError(message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Anggota
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Data Anggota</h1>
        <p className="text-sm text-slate-600">{anggotaCountLabel}</p>
        <p className="text-sm text-slate-500">Kelola anggota koperasi dan statusnya.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <PanelCard title="Pencarian & Filter">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.6fr_0.6fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari ID / NIP / NIK / Nama"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Tidak Aktif</option>
          </select>
          <select
            value={deptFilter}
            onChange={(event) => setDeptFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="">Semua Departemen</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
              onClick={loadData}
            >
              Search
            </button>
            <button
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Tambah Anggota"
        action={
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah Anggota"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={formState.no}
              onChange={(event) => setFormState({ ...formState, no: event.target.value })}
              placeholder="No Anggota"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={formState.nama}
              onChange={(event) => setFormState({ ...formState, nama: event.target.value })}
              placeholder="Nama Lengkap"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.nip}
              onChange={(event) => setFormState({ ...formState, nip: event.target.value })}
              placeholder="NIP"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.nik}
              onChange={(event) => setFormState({ ...formState, nik: event.target.value })}
              placeholder="NIK"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.no_hp}
              onChange={(event) => setFormState({ ...formState, no_hp: event.target.value })}
              placeholder="No HP"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.dept}
              onChange={(event) => setFormState({ ...formState, dept: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Departemen</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={formState.jabatan}
              onChange={(event) => setFormState({ ...formState, jabatan: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Jabatan</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            <input
              value={formState.gaji}
              onChange={(event) => setFormState({ ...formState, gaji: event.target.value })}
              placeholder="Gaji"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.tgl_masuk}
              onChange={(event) => setFormState({ ...formState, tgl_masuk: event.target.value })}
              placeholder="Tgl Masuk"
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.limit_kredit}
              onChange={(event) => setFormState({ ...formState, limit_kredit: event.target.value })}
              placeholder="Limit Kredit"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.limit_pinjaman}
              onChange={(event) => setFormState({ ...formState, limit_pinjaman: event.target.value })}
              placeholder="Limit Pinjaman"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.limit_darurat}
              onChange={(event) => setFormState({ ...formState, limit_darurat: event.target.value })}
              placeholder="Limit Darurat"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={formState.max_loans}
              onChange={(event) => setFormState({ ...formState, max_loans: event.target.value })}
              placeholder="Max Pinjaman Aktif"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={formState.status}
              onChange={(event) => setFormState({ ...formState, status: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="1">Aktif</option>
              <option value="0">Tidak Aktif</option>
            </select>
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
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik "Tambah Anggota" untuk membuka form.</div>
        )}
      </PanelCard>

      {showEditForm && (
        <PanelCard title="Edit Anggota">
          <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={editState.no}
              onChange={(event) => setEditState({ ...editState, no: event.target.value })}
              placeholder="No Anggota"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              required
              value={editState.nama}
              onChange={(event) => setEditState({ ...editState, nama: event.target.value })}
              placeholder="Nama Lengkap"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.nip}
              onChange={(event) => setEditState({ ...editState, nip: event.target.value })}
              placeholder="NIP"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.nik}
              onChange={(event) => setEditState({ ...editState, nik: event.target.value })}
              placeholder="NIK"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.no_hp}
              onChange={(event) => setEditState({ ...editState, no_hp: event.target.value })}
              placeholder="No HP"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={editState.dept}
              onChange={(event) => setEditState({ ...editState, dept: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="">Pilih Departemen</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <input
              value={editState.jabatan}
              onChange={(event) => setEditState({ ...editState, jabatan: event.target.value })}
              placeholder="Jabatan"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.gaji}
              onChange={(event) => setEditState({ ...editState, gaji: event.target.value })}
              placeholder="Gaji"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.tgl_masuk}
              onChange={(event) => setEditState({ ...editState, tgl_masuk: event.target.value })}
              placeholder="Tgl Masuk"
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.limit_kredit}
              onChange={(event) => setEditState({ ...editState, limit_kredit: event.target.value })}
              placeholder="Limit Kredit"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.limit_pinjaman}
              onChange={(event) => setEditState({ ...editState, limit_pinjaman: event.target.value })}
              placeholder="Limit Pinjaman"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.limit_darurat}
              onChange={(event) => setEditState({ ...editState, limit_darurat: event.target.value })}
              placeholder="Limit Darurat"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              value={editState.max_loans}
              onChange={(event) => setEditState({ ...editState, max_loans: event.target.value })}
              placeholder="Max Pinjaman Aktif"
              type="number"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={editState.status}
              onChange={(event) => setEditState({ ...editState, status: event.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="1">Aktif</option>
              <option value="0">Tidak Aktif</option>
            </select>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updating}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {updating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </PanelCard>
      )}

      <PanelCard title="List Anggota">
        <DataTable
          columns={[
            { key: "no", label: "No Anggota", className: "w-28" },
            { key: "nip", label: "NIP" },
            { key: "nama", label: "Nama" },
            { key: "dept", label: "Dept" },
            { key: "jabatan", label: "Jabatan" },
            { key: "no_hp", label: "No HP" },
            {
              key: "simpanan",
              label: "Simpanan",
              render: (row) => (simpananMap[row.id] ? simpananMap[row.id].toLocaleString("id-ID") : "0"),
              className: "text-indigo-700 font-semibold",
            },
            {
              key: "piutang",
              label: "Piutang",
              render: (row) => formatRupiah(piutangMap[row.id] || 0),
              className: "text-amber-800 font-semibold",
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {row.status === 1 || row.status === "1" ? "Aktif" : "Tidak Aktif"}
                </span>
              ),
            },
            {
              key: "aksi",
              label: "Aksi",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(row)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                  >
                    Hapus
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading members..." : "No members available"}
        />
      </PanelCard>
    </div>
  );
}
