import { clearAuth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export type ApiError = {
  message: string;
  status: number;
};

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const buildUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}) => {
  const { auth = true, headers, ...rest } = options;
  const token = auth ? localStorage.getItem("sikokar_token") : null;
  const mergedHeaders = new Headers(headers);

  if (!mergedHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: mergedHeaders,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearAuth();
      window.location.href = "/login";
    }
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "Request failed";
    const error: ApiError = { message, status: response.status };
    throw error;
  }

  return payload as T;
};

export const loginRequest = (username: string, password: string) =>
  apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ username, password }),
  });

const withQuery = (path: string, params?: Record<string, string | number | null | undefined>) => {
  if (!params) {
    return path;
  }
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const listAnggota = (params?: { q?: string; status?: string | number }) =>
  apiRequest<{ data: Anggota[] }>(withQuery("/anggota", params));
export const listSimpanan = (params?: { anggota_id?: string; jenis?: string }) =>
  apiRequest<{ data: Simpanan[] }>(withQuery("/simpanan", params));
export const listPinjaman = (params?: { status?: string; anggota_id?: string }) =>
  apiRequest<{ data: Pinjaman[] }>(withQuery("/pinjaman", params));
export const listBarang = (params?: { q?: string; kategori?: string }) =>
  apiRequest<{ data: Barang[] }>(withQuery("/barang", params));
export const listPenjualan = (params?: { jenis?: string; anggota_id?: string }) =>
  apiRequest<{ data: Penjualan[] }>(withQuery("/penjualan", params));
export const listSupplier = (params?: { q?: string; jenis?: string; aktif?: string | number }) =>
  apiRequest<{ data: Supplier[] }>(withQuery("/supplier", params));
export const listStok = (params?: { barang_id?: string; lokasi_id?: string }) =>
  apiRequest<{ data: Stok[] }>(withQuery("/stok", params));
export const listLokasi = () => apiRequest<{ data: Lokasi[] }>("/lokasi");
export const listCoa = (params?: { tipe?: string; aktif?: string | number }) =>
  apiRequest<{ data: Coa[] }>(withQuery("/coa", params));
export const listApproval = (params?: { status?: string; modul?: string }) =>
  apiRequest<{ data: Approval[] }>(withQuery("/approval", params));

export const createAnggota = (payload: Partial<Anggota> & { id: string; no: string; nama: string }) =>
  apiRequest<{ id: string; no: string; nama: string }>("/anggota", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createBarang = (payload: Partial<Barang> & { id: string; kode: string; nama: string }) =>
  apiRequest<{ id: string; kode: string; nama: string }>("/barang", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateBarang = (id: string, payload: Partial<Barang>) =>
  apiRequest<{ id: string; kode: string; nama: string }>(`/barang/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const createSupplier = (payload: Partial<Supplier> & { id: string; nama: string }) =>
  apiRequest<{ id: string; nama: string }>("/supplier", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createPinjaman = (payload: Partial<Pinjaman> & { id: string; no: string; anggota_id: string }) =>
  apiRequest<{ id: string; no: string; status: string }>("/pinjaman", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createCoa = (payload: Partial<Coa> & { id: string; kode: string; nama: string; tipe: string }) =>
  apiRequest<{ id: string; kode: string; nama: string }>("/coa", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createPosCheckout = (payload: PosCheckoutPayload) =>
  apiRequest<{ id: string; no: string; total: number }>("/pos/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createRentalAsset = (payload: RentalAssetPayload) =>
  apiRequest<{ id: string; kode: string; nama: string }>("/rental", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export type Anggota = {
  id: string;
  no: string;
  nip?: string | null;
  nama: string;
  nik?: string | null;
  dept?: string | null;
  jabatan?: string | null;
  no_hp?: string | null;
  gaji?: number | null;
  limit_kredit?: number | null;
  limit_pinjaman?: number | null;
  limit_darurat?: number | null;
  max_loans?: number | null;
  status?: number | string | null;
  tgl_masuk?: string | null;
};

export type Simpanan = {
  id: string;
  anggota_id: string;
  jenis: string;
  saldo: number;
  updated_at?: string | null;
};

export type Pinjaman = {
  id: string;
  no: string;
  anggota_id: string;
  jenis: string;
  nominal_pengajuan: number;
  nominal_disetujui: number;
  bunga_pct?: number | null;
  angsuran_per_bulan?: number | null;
  sisa_pokok?: number | null;
  tenor: number;
  status: string;
  tgl_pengajuan?: string | null;
  tgl_cair?: string | null;
};

export type Barang = {
  id: string;
  kode: string;
  nama: string;
  kategori?: string | null;
  satuan?: string | null;
  harga_beli?: number | null;
  harga_jual?: number | null;
  tipe?: string | null;
  supplier_id?: string | null;
  is_taxable?: number | boolean | null;
};

export type Supplier = {
  id: string;
  kode?: string | null;
  nama: string;
  jenis?: string | null;
  aktif?: number | string | null;
  npwp?: string | null;
  alamat?: string | null;
  telp?: string | null;
  is_pkp?: number | boolean | null;
};

export type Stok = {
  id: string;
  barang_id: string;
  lokasi_id?: string | null;
  jumlah?: number | null;
  updated_at?: string | null;
};

export type Coa = {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  level: number;
  aktif?: number | string | null;
};

export type Approval = {
  id: string;
  modul: string;
  status: string;
  created_at?: string | null;
};

export type Lokasi = {
  id: string;
  kode?: string | null;
  nama: string;
  aktif?: number | string | null;
};

export type PosCheckoutPayload = {
  id: string;
  no: string;
  tgl: string;
  lokasi_id?: string | null;
  jenis?: string;
  anggota_id?: string | null;
  subtotal: number;
  diskon_total: number;
  ppn_total: number;
  total: number;
  status?: string;
  kasir_id?: string | null;
  items: Array<{
    id?: string;
    barang_id?: string | null;
    nama?: string | null;
    qty?: number;
    harga_beli_at?: number;
    harga_jual_at?: number;
    diskon_pct?: number;
    subtotal?: number;
  }>;
};

export type RentalAssetPayload = {
  id: string;
  kode: string;
  nama: string;
  kategori?: string | null;
  tarif_harian?: number | null;
  tarif_bulanan?: number | null;
  kapasitas?: number | null;
  nopol?: string | null;
  status?: string | null;
};

export type Penjualan = {
  id: string;
  no: string;
  tgl: string;
  jenis: string;
  total: number;
  status: string;
};
