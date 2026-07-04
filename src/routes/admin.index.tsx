import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ImageIcon, Shield, LayoutDashboard } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin, listTradeResults } from "@/lib/trade-results.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Trade Rise FX" },
      { name: "description", content: "Central admin dashboard for managing Trade Rise FX site content." },
    ],
  }),
  component: AdminIndexPage,
});

function AdminIndexPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const trQ = useQuery({
    queryKey: ["admin-tr-count"],
    queryFn: () => listTradeResults(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  if (loading || !user || adminQ.isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="animate-spin text-gold" />
      </div>
    );
  }

  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="pt-32 pb-16 px-6 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Trade Rise FX admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
            <ArrowLeft size={14} /> Back to Trade Rise FX dashboard
          </Link>
        </main>
      </div>
    );
  }

  const tradeResultCount = trQ.data?.results?.length ?? 0;

  const tools = [
    {
      to: "/admin/trade-results" as const,
      label: "Trade Rise FX Trade Results",
      description: "Upload Trade Rise FX trade screenshots and target individual users.",
      icon: ImageIcon,
      stat: trQ.isLoading ? "…" : `${tradeResultCount} uploaded`,
    },
    {
      to: "/dashboard" as const,
      label: "My Trade Rise FX Dashboard",
      description: "View your Trade Rise FX balances, referrals and withdrawals.",
      icon: LayoutDashboard,
      stat: null,
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Nav />
          <main className="flex-1 pt-28 pb-16">
            <section className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <SidebarTrigger className="h-8 w-8 shrink-0" />
                <AdminBreadcrumb currentPage="Control Panel" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                  <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold inline-flex items-center gap-3 flex-wrap">
                    <Shield className="text-gold shrink-0" /> Trade Rise FX control panel
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quick access to all Trade Rise FX admin tools.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Trade Rise FX dashboard</span><span className="sm:hidden">Dashboard</span>
                </Link>
              </div>

              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    className="group rounded-2xl border border-border bg-card/50 p-5 hover:border-gold/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gold/10 grid place-items-center text-gold">
                        <t.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{t.label}</div>
                        {t.stat && (
                          <div className="text-xs text-muted-foreground">{t.stat}</div>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
