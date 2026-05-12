import AuthGuard from "@/components/AuthGuard";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef3ff,_#f5f7fb_45%,_#eef1f7_100%)]">
        <div className="flex">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar />
            <MobileNav />
            <main className="flex-1 px-6 py-6">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
