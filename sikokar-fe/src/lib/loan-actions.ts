import { apiRequest } from "@/lib/api";

export const bayarAngsuran = (id: string, payload: { tanggal: string; metode: string }) =>
  apiRequest<{ id: string; status: string }>(`/pinjaman/${id}/angsuran`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const lunasiPinjaman = (id: string) =>
  apiRequest<{ id: string; status: string }>(`/pinjaman/${id}/lunas`, {
    method: "POST"
  });
