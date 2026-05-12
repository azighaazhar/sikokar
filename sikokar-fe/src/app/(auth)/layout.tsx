export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8efff,_#f7f8fb_55%,_#eff2f7_100%)]">
      {children}
    </div>
  );
}
