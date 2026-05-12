export type Role = "admin" | "pengurus" | "kasir" | "simpin" | "accounting";

export type NavItem = {
  label: string;
  href: string;
  slug?: string;
};

const feature = (slug: string, label: string): NavItem => ({
  label,
  href: `/feature/${slug}`,
  slug,
});

const adminPengurusNav: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Anggota", href: "/members" },
  { label: "Barang dan Stok", href: "/inventory" },
  { label: "Supplier", href: "/suppliers" },
  { label: "Chart of Account", href: "/coa" },
  { label: "Toko/POS", href: "/pos" },
  { label: "Pembelian", href: "/purchases" },
  { label: "Pengelolaan Aset", href: "/rental" },
  { label: "Simpanan", href: "/savings" },
  { label: "Pinjaman", href: "/loans" },
  { label: "Kredit Motor dan Elektronik", href: "/credit" },
  feature("ppob", "PPOB (Tahap Pengembangan)"),
  { label: "Pembukuan", href: "/ledger" },
  { label: "Approval", href: "/approvals" },
  { label: "Kolektif Potong Gaji", href: "/payroll-collective" },
  { label: "Laporan dan Analisis", href: "/reports" },
  { label: "Laporan Konsolidasi", href: "/reports/consolidated" },
  { label: "Pengaturan", href: "/settings" },
];

const kasirNav: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Toko/POS", href: "/pos" },
  { label: "Pembelian", href: "/purchases" },
  feature("ppob", "PPOB"),
  { label: "Pengaturan", href: "/settings" },
];

const simpinNav: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Anggota", href: "/members" },
  { label: "Simpanan", href: "/savings" },
  { label: "Pinjaman", href: "/loans" },
  { label: "Kredit Motor dan Listrik", href: "/credit" },
  { label: "Kolektif Potong Gaji", href: "/payroll-collective" },
  { label: "Pengaturan", href: "/settings" },
];

const accountingNav: NavItem[] = [
  { label: "Chart of Account", href: "/coa" },
  { label: "Pembukuan", href: "/ledger" },
  { label: "Approval", href: "/approvals" },
  { label: "Laporan dan Analisis", href: "/reports" },
  { label: "Laporan Konsolidasi", href: "/reports/consolidated" },
  { label: "Pengaturan", href: "/settings" },
];

const navByRole: Record<Role, NavItem[]> = {
  admin: adminPengurusNav,
  pengurus: adminPengurusNav,
  kasir: kasirNav,
  simpin: simpinNav,
  accounting: accountingNav,
};

export const getNavItems = (role?: string | null) => {
  if (!role) {
    return adminPengurusNav;
  }
  return navByRole[role as Role] || adminPengurusNav;
};

export const featureLabelBySlug = new Map(
  [adminPengurusNav, kasirNav, simpinNav, accountingNav]
    .flat()
    .filter((item) => item.slug)
    .map((item) => [item.slug as string, item.label])
);
