"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import PanelCard from "@/components/PanelCard";
import {
  createBarang,
  createSupplier,
  listBarang,
  listSupplier,
  updateBarang,
  updateSupplier,
  type Barang,
  type Supplier,
} from "@/lib/api";

type DraftBarang = {
  tempId: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  harga_beli: string;
  harga_jual: string;
  barcode: string;
  tipe: string;
  is_taxable: boolean;
};

const newDraftRow = (): DraftBarang => ({
  tempId: `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  kode: "",
  nama: "",
  kategori: "",
  satuan: "pcs",
  harga_beli: "",
  harga_jual: "",
  barcode: "",
  tipe: "regular",
  is_taxable: false,
});

const emptySupplierForm = () => ({
  kode: "",
  nama: "",
  jenis: "regular",
  aktif: "1",
  npwp: "",
  is_pkp: false,
  alamat: "",
  telp: "",
});

const emptyNewBarangForm = () => ({
  kode: "",
  nama: "",
  kategori: "",
  satuan: "pcs",
  harga_beli: "",
  harga_jual: "",
  barcode: "",
  tipe: "regular",
  is_taxable: false,
});

const uniqueBarangId = () => `B${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(emptySupplierForm);
  const [createBarangDrafts, setCreateBarangDrafts] = useState<DraftBarang[]>([]);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState(emptySupplierForm);
  const [editBarangList, setEditBarangList] = useState<Barang[]>([]);
  const [editBarangLoading, setEditBarangLoading] = useState(false);
  const [savingSupplierEdit, setSavingSupplierEdit] = useState(false);
  const [newBarangForm, setNewBarangForm] = useState(emptyNewBarangForm);
  const [addingBarang, setAddingBarang] = useState(false);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);

  const fetchSuppliers = async (qSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSupplier({ q: qSearch.trim() || undefined });
      setRows(response.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load suppliers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSuppliers("");
  }, []);

  const loadData = () => fetchSuppliers(search);

  const resetFilters = async () => {
    setSearch("");
    await fetchSuppliers("");
  };

  const loadBarangForSupplier = async (supplierId: string) => {
    setEditBarangLoading(true);
    try {
      const res = await listBarang({ supplier_id: supplierId });
      setEditBarangList(res.data);
    } catch {
      setEditBarangList([]);
    } finally {
      setEditBarangLoading(false);
    }
  };

  const startEdit = (row: Supplier) => {
    setEditingSupplier(row);
    setEditForm({
      kode: row.kode || "",
      nama: row.nama || "",
      jenis: row.jenis || "regular",
      aktif: row.aktif === 0 || row.aktif === "0" ? "0" : "1",
      npwp: row.npwp || "",
      is_pkp: Boolean(row.is_pkp),
      alamat: row.alamat || "",
      telp: row.telp || "",
    });
    setNewBarangForm(emptyNewBarangForm());
    void loadBarangForSupplier(row.id);
    setShowForm(false);
  };

  const closeEdit = () => {
    setEditingSupplier(null);
    setEditBarangList([]);
  };

  const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supplierId = `S${Date.now()}`;
      await createSupplier({
        id: supplierId,
        kode: formState.kode || null,
        nama: formState.nama,
        jenis: formState.jenis,
        aktif: formState.aktif === "1" ? 1 : 0,
        npwp: formState.npwp || null,
        is_pkp: formState.is_pkp,
        alamat: formState.alamat || null,
        telp: formState.telp || null,
      });

      const draftsWithContent = createBarangDrafts.filter((d) => d.kode.trim() && d.nama.trim());
      for (const d of draftsWithContent) {
        await createBarang({
          id: uniqueBarangId(),
          kode: d.kode.trim(),
          nama: d.nama.trim(),
          barcode: d.barcode.trim() || null,
          kategori: d.kategori.trim() || null,
          satuan: d.satuan.trim() || "pcs",
          harga_beli: d.harga_beli ? Number(d.harga_beli) : 0,
          harga_jual: d.harga_jual ? Number(d.harga_jual) : 0,
          tipe: d.tipe || "regular",
          supplier_id: supplierId,
          is_taxable: d.is_taxable,
        });
      }

      setShowForm(false);
      setFormState(emptySupplierForm());
      setCreateBarangDrafts([]);
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menambah supplier / barang";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupplierEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSupplier) return;
    setSavingSupplierEdit(true);
    setError(null);
    try {
      await updateSupplier(editingSupplier.id, {
        kode: editForm.kode || null,
        nama: editForm.nama,
        jenis: editForm.jenis,
        aktif: editForm.aktif === "1" ? 1 : 0,
        npwp: editForm.npwp || null,
        is_pkp: editForm.is_pkp,
        alamat: editForm.alamat || null,
        telp: editForm.telp || null,
      });
      setEditingSupplier((prev) =>
        prev
          ? {
              ...prev,
              kode: editForm.kode || null,
              nama: editForm.nama,
              jenis: editForm.jenis,
              aktif: editForm.aktif === "1" ? 1 : 0,
              npwp: editForm.npwp || null,
              is_pkp: editForm.is_pkp ? 1 : 0,
              alamat: editForm.alamat || null,
              telp: editForm.telp || null,
            }
          : null
      );
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal memperbarui supplier";
      setError(message);
    } finally {
      setSavingSupplierEdit(false);
    }
  };

  const updateEditBarangField = (id: string, patch: Partial<Barang>) => {
    setEditBarangList((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const saveBarangRow = async (b: Barang) => {
    setRowSavingId(b.id);
    setError(null);
    try {
      await updateBarang(b.id, {
        kode: b.kode,
        nama: b.nama,
        barcode: b.barcode || null,
        kategori: b.kategori || null,
        satuan: b.satuan || "pcs",
        harga_beli: Number(b.harga_beli ?? 0),
        harga_jual: Number(b.harga_jual ?? 0),
        tipe: b.tipe || "regular",
        supplier_id: editingSupplier?.id ?? b.supplier_id,
        is_taxable: Boolean(b.is_taxable),
      });
      await loadBarangForSupplier(editingSupplier!.id);
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menyimpan barang";
      setError(message);
    } finally {
      setRowSavingId(null);
    }
  };

  const unlinkBarang = async (barangId: string) => {
    if (!window.confirm("Lepas barang ini dari supplier? (Barang tetap ada di master, supplier dikosongkan.)")) return;
    setRowSavingId(barangId);
    setError(null);
    try {
      await updateBarang(barangId, { supplier_id: null });
      await loadBarangForSupplier(editingSupplier!.id);
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal melepas barang";
      setError(message);
    } finally {
      setRowSavingId(null);
    }
  };

  const handleAddBarangToSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSupplier) return;
    if (!newBarangForm.kode.trim() || !newBarangForm.nama.trim()) {
      setError("Kode dan nama barang wajib diisi.");
      return;
    }
    setAddingBarang(true);
    setError(null);
    try {
      await createBarang({
        id: uniqueBarangId(),
        kode: newBarangForm.kode.trim(),
        nama: newBarangForm.nama.trim(),
        barcode: newBarangForm.barcode.trim() || null,
        kategori: newBarangForm.kategori.trim() || null,
        satuan: newBarangForm.satuan.trim() || "pcs",
        harga_beli: newBarangForm.harga_beli ? Number(newBarangForm.harga_beli) : 0,
        harga_jual: newBarangForm.harga_jual ? Number(newBarangForm.harga_jual) : 0,
        tipe: newBarangForm.tipe || "regular",
        supplier_id: editingSupplier.id,
        is_taxable: newBarangForm.is_taxable,
      });
      setNewBarangForm(emptyNewBarangForm());
      await loadBarangForSupplier(editingSupplier.id);
      await loadData();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Gagal menambah barang";
      setError(message);
    } finally {
      setAddingBarang(false);
    }
  };

  const supplierFieldsCreate = (
    <div className="grid gap-4 md:grid-cols-3">
      <input
        value={formState.kode}
        onChange={(event) => setFormState({ ...formState, kode: event.target.value })}
        placeholder="Kode Supplier"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        required
        value={formState.nama}
        onChange={(event) => setFormState({ ...formState, nama: event.target.value })}
        placeholder="Nama Supplier"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <select
        value={formState.jenis}
        onChange={(event) => setFormState({ ...formState, jenis: event.target.value })}
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      >
        <option value="regular">Regular</option>
        <option value="konsinyasi">Konsinyasi</option>
      </select>
      <select
        value={formState.aktif}
        onChange={(event) => setFormState({ ...formState, aktif: event.target.value })}
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      >
        <option value="1">Aktif</option>
        <option value="0">Tidak Aktif</option>
      </select>
      <input
        value={formState.npwp}
        onChange={(event) => setFormState({ ...formState, npwp: event.target.value })}
        placeholder="NPWP"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={formState.is_pkp}
          onChange={(event) => setFormState({ ...formState, is_pkp: event.target.checked })}
        />
        Supplier PKP
      </label>
      <input
        value={formState.alamat}
        onChange={(event) => setFormState({ ...formState, alamat: event.target.value })}
        placeholder="Alamat"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        value={formState.telp}
        onChange={(event) => setFormState({ ...formState, telp: event.target.value })}
        placeholder="No Telpon"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    </div>
  );

  const supplierFieldsEdit = (
    <div className="grid gap-4 md:grid-cols-3">
      <input
        value={editForm.kode}
        onChange={(event) => setEditForm({ ...editForm, kode: event.target.value })}
        placeholder="Kode Supplier"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        required
        value={editForm.nama}
        onChange={(event) => setEditForm({ ...editForm, nama: event.target.value })}
        placeholder="Nama Supplier"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <select
        value={editForm.jenis}
        onChange={(event) => setEditForm({ ...editForm, jenis: event.target.value })}
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      >
        <option value="regular">Regular</option>
        <option value="konsinyasi">Konsinyasi</option>
      </select>
      <select
        value={editForm.aktif}
        onChange={(event) => setEditForm({ ...editForm, aktif: event.target.value })}
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      >
        <option value="1">Aktif</option>
        <option value="0">Tidak Aktif</option>
      </select>
      <input
        value={editForm.npwp}
        onChange={(event) => setEditForm({ ...editForm, npwp: event.target.value })}
        placeholder="NPWP"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={editForm.is_pkp}
          onChange={(event) => setEditForm({ ...editForm, is_pkp: event.target.checked })}
        />
        Supplier PKP
      </label>
      <input
        value={editForm.alamat}
        onChange={(event) => setEditForm({ ...editForm, alamat: event.target.value })}
        placeholder="Alamat"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <input
        value={editForm.telp}
        onChange={(event) => setEditForm({ ...editForm, telp: event.target.value })}
        placeholder="No Telpon"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Supplier</div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">Data Supplier</h1>
        <p className="text-sm text-slate-500">
          Tambah supplier beserta daftar barang sekaligus, atau edit supplier dan kelola barang di halaman yang sama.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      <PanelCard title="Pencarian Supplier">
        <div className="grid gap-4 md:grid-cols-[1.3fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / kode supplier"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => void loadData()}
            >
              Search
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </PanelCard>

      {editingSupplier && (
        <PanelCard
          title={`Edit supplier: ${editingSupplier.nama}`}
          action={
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Tutup
            </button>
          }
        >
          <form onSubmit={handleSaveSupplierEdit} className="flex flex-col gap-6">
            {supplierFieldsEdit}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingSupplierEdit}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {savingSupplierEdit ? "Menyimpan…" : "Simpan data supplier"}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Barang milik supplier</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ubah detail lalu simpan per baris, tambah barang baru, atau lepas dari supplier.
            </p>

            {editBarangLoading ? (
              <p className="mt-4 text-sm text-slate-500">Memuat barang…</p>
            ) : editBarangList.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Belum ada barang yang ditautkan ke supplier ini.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Kode</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2">Satuan</th>
                      <th className="px-3 py-2">Beli</th>
                      <th className="px-3 py-2">Jual</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">PPN</th>
                      <th className="px-3 py-2 w-40">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editBarangList.map((b) => (
                      <tr key={b.id}>
                        <td className="px-2 py-2">
                          <input
                            value={b.kode}
                            onChange={(e) => updateEditBarangField(b.id, { kode: e.target.value })}
                            className="w-full min-w-[6rem] rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={b.nama}
                            onChange={(e) => updateEditBarangField(b.id, { nama: e.target.value })}
                            className="w-full min-w-[8rem] rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={b.kategori || ""}
                            onChange={(e) => updateEditBarangField(b.id, { kategori: e.target.value })}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={b.satuan || "pcs"}
                            onChange={(e) => updateEditBarangField(b.id, { satuan: e.target.value })}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={b.harga_beli ?? 0}
                            onChange={(e) => updateEditBarangField(b.id, { harga_beli: Number(e.target.value) })}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={b.harga_jual ?? 0}
                            onChange={(e) => updateEditBarangField(b.id, { harga_jual: Number(e.target.value) })}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={b.tipe || "regular"}
                            onChange={(e) => updateEditBarangField(b.id, { tipe: e.target.value })}
                            className="rounded border border-slate-200 px-1 py-1 text-xs"
                          >
                            <option value="regular">Regular</option>
                            <option value="promo">Promo</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={Boolean(b.is_taxable)}
                            onChange={(e) => updateEditBarangField(b.id, { is_taxable: e.target.checked })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={rowSavingId === b.id}
                              onClick={() => void saveBarangRow(b)}
                              className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              disabled={rowSavingId === b.id}
                              onClick={() => void unlinkBarang(b.id)}
                              className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                            >
                              Lepas
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={handleAddBarangToSupplier} className="mt-6 rounded-xl border border-dashed border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-800">Tambah barang baru</div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <input
                  required
                  value={newBarangForm.kode}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, kode: e.target.value })}
                  placeholder="Kode *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={newBarangForm.nama}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, nama: e.target.value })}
                  placeholder="Nama *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                />
                <input
                  value={newBarangForm.kategori}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, kategori: e.target.value })}
                  placeholder="Kategori"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={newBarangForm.satuan}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, satuan: e.target.value })}
                  placeholder="Satuan"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newBarangForm.harga_beli}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, harga_beli: e.target.value })}
                  placeholder="Harga beli"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newBarangForm.harga_jual}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, harga_jual: e.target.value })}
                  placeholder="Harga jual"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={newBarangForm.barcode}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, barcode: e.target.value })}
                  placeholder="Barcode"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={newBarangForm.tipe}
                  onChange={(e) => setNewBarangForm({ ...newBarangForm, tipe: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="regular">Regular</option>
                  <option value="promo">Promo</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={newBarangForm.is_taxable}
                    onChange={(e) => setNewBarangForm({ ...newBarangForm, is_taxable: e.target.checked })}
                  />
                  Kena PPN
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={addingBarang}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {addingBarang ? "Menambah…" : "Tambahkan ke supplier"}
                </button>
              </div>
            </form>
          </div>
        </PanelCard>
      )}

      <PanelCard
        title="Tambah Supplier"
        action={
          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              if (!showForm) {
                setEditingSupplier(null);
                setCreateBarangDrafts([]);
              }
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            {showForm ? "Tutup Form" : "Tambah Supplier"}
          </button>
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmitCreate} className="flex flex-col gap-6">
            {supplierFieldsCreate}

            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Barang dari supplier (opsional)</h3>
                <button
                  type="button"
                  onClick={() => setCreateBarangDrafts((d) => [...d, newDraftRow()])}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  + Tambah baris
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Baris dengan kode dan nama terisi akan disimpan sekaligus setelah supplier dibuat. Kode barang harus unik di seluruh sistem.
              </p>

              {createBarangDrafts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Belum ada baris. Klik &quot;Tambah baris&quot; untuk menambahkan.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="px-2 py-2">Kode</th>
                        <th className="px-2 py-2">Nama</th>
                        <th className="px-2 py-2">Kategori</th>
                        <th className="px-2 py-2">Satuan</th>
                        <th className="px-2 py-2">Harga beli</th>
                        <th className="px-2 py-2">Harga jual</th>
                        <th className="px-2 py-2">Barcode</th>
                        <th className="px-2 py-2">Tipe</th>
                        <th className="px-2 py-2">PPN</th>
                        <th className="px-2 py-2 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {createBarangDrafts.map((d) => (
                        <tr key={d.tempId}>
                          <td className="px-2 py-1">
                            <input
                              value={d.kode}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, kode: e.target.value } : r))
                                )
                              }
                              className="w-full min-w-[5rem] rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={d.nama}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, nama: e.target.value } : r))
                                )
                              }
                              className="w-full min-w-[6rem] rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={d.kategori}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, kategori: e.target.value } : r))
                                )
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={d.satuan}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, satuan: e.target.value } : r))
                                )
                              }
                              className="w-14 rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={d.harga_beli}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, harga_beli: e.target.value } : r))
                                )
                              }
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={d.harga_jual}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, harga_jual: e.target.value } : r))
                                )
                              }
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={d.barcode}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, barcode: e.target.value } : r))
                                )
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <select
                              value={d.tipe}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) => (r.tempId === d.tempId ? { ...r, tipe: e.target.value } : r))
                                )
                              }
                              className="rounded border border-slate-200 px-1 py-1 text-xs"
                            >
                              <option value="regular">Regular</option>
                              <option value="promo">Promo</option>
                            </select>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={d.is_taxable}
                              onChange={(e) =>
                                setCreateBarangDrafts((rows) =>
                                  rows.map((r) =>
                                    r.tempId === d.tempId ? { ...r, is_taxable: e.target.checked } : r
                                  )
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                setCreateBarangDrafts((rows) => rows.filter((r) => r.tempId !== d.tempId))
                              }
                              className="text-xs font-semibold text-rose-600"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
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
                {saving ? "Menyimpan…" : "Simpan supplier & barang"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-slate-500">Klik &quot;Tambah Supplier&quot; untuk membuka form.</div>
        )}
      </PanelCard>

      <PanelCard title="List Supplier">
        <DataTable
          columns={[
            { key: "kode", label: "Kode", className: "w-24" },
            { key: "nama", label: "Nama Supplier" },
            { key: "jenis", label: "Jenis" },
            {
              key: "is_pkp",
              label: "PKP",
              render: (row) => (row.is_pkp ? "PKP" : "Non PKP"),
            },
            { key: "npwp", label: "NPWP" },
            { key: "alamat", label: "Alamat" },
            { key: "telp", label: "Telpon" },
            {
              key: "aktif",
              label: "Status",
              render: (row) => (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {row.aktif === 1 || row.aktif === "1" ? "Aktif" : "Tidak Aktif"}
                </span>
              ),
            },
            {
              key: "aksi",
              label: "Aksi",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Edit & barang
                </button>
              ),
            },
          ]}
          rows={rows}
          emptyLabel={loading ? "Loading suppliers..." : "No suppliers available"}
        />
      </PanelCard>
    </div>
  );
}
