import { featureLabelBySlug } from "@/lib/navigation";

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const label = featureLabelBySlug.get(params.slug) || params.slug.replace(/-/g, " ");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Feature
        </div>
        <h1 className="mt-2 text-2xl font-display font-semibold text-slate-900">
          {label}
        </h1>
        <p className="text-sm text-slate-500">Halaman ini belum tersedia.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Placeholder untuk modul {label}. Nanti bisa diisi sesuai kebutuhan.
      </div>
    </div>
  );
}
