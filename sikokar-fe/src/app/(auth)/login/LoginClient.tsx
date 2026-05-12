"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRequest } from "@/lib/api";
import { getToken, setAuth } from "@/lib/auth";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginRequest(username, password);
      setAuth(response.token, response.user);
      router.replace(nextUrl);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-10">
            <div className="mb-8">
              <div className="text-2xl font-semibold text-slate-900">SIKOKAR</div>
              <div className="text-sm text-slate-500">Koperasi Karawang dashboard</div>
            </div>
            <h1 className="mb-2 text-3xl font-display font-semibold text-slate-900">Welcome back</h1>
            <p className="mb-6 text-sm text-slate-500">
              Sign in to manage members, savings, loans, and store operations.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <div className="relative hidden items-end justify-center bg-indigo-600 px-8 py-10 text-white lg:flex">
            <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-indigo-500/60 blur-2xl" />
            <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10 max-w-xs">
              <div className="mb-3 text-sm uppercase tracking-[0.2em] text-indigo-100">
                Daily overview
              </div>
              <div className="text-2xl font-semibold leading-snug">
                Stay on top of cooperative performance with real-time data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
