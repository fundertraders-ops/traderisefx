import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, ArrowLeft, RefreshCcw } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import { listEmailLog } from "@/lib/admin-emails.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({ meta: [{ title: "Email Log — Trade Rise FX Admin" }] }),
  component: AdminEmailsPage,
});

function statusBadge(status: string) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  switch (status) {
    case "sent":
      return `${base} border-green-500/30 text-green-600 bg-green-500/10`;
    case "pending":
      return `${base} border-yellow-500/30 text-yellow-600 bg-yellow-500/10`;
    case "failed":
    case "dlq":
    case "bounced":
    case "complained":
      return `${base} border-red-500/30 text-red-600 bg-red-500/10`;
    case "suppressed":
      return `${base} border-muted text-muted-foreground bg-muted/30`;
    default:
      return `${base} border-border text-muted-foreground`;
  }
}

function AdminEmailsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchEmails = useServerFn(listEmailLog);

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/auth", search: { redirect: "/admin/emails" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const listQ = useQuery({
    queryKey: ["admin-email-log"],
    queryFn: () => fetchEmails(),
    enabled: !!user && adminQ.data?.isAdmin === true,
    refetchInterval: 15000,
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
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const emails = listQ.data?.emails ?? [];
  const failedCount = emails.filter((e: any) => ["failed", "dlq", "bounced", "complained"].includes(e.status)).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Nav />
          <main className="flex-1 pt-28 pb-16">
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <SidebarTrigger className="h-8 w-8 shrink-0" />
                <AdminBreadcrumb currentPage="Email Log" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Notifications</span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-bold inline-flex items-center gap-2">
                    <Mail className="text-gold" /> Email log
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    All purchase confirmations, admin notifications and delivery failures.
                  </p>
                </div>
                <button
                  onClick={() => listQ.refetch()}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <RefreshCcw size={14} /> Refresh
                </button>
              </div>

              {failedCount > 0 && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  ⚠️ {failedCount} delivery failure{failedCount > 1 ? "s" : ""} — review the rows highlighted red below.
                </div>
              )}

              <div className="mt-6 rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Template</th>
                      <th className="px-3 py-2 font-medium">Recipient</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listQ.isLoading && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        <Loader2 className="inline animate-spin mr-2" size={14} /> Loading…
                      </td></tr>
                    )}
                    {!listQ.isLoading && emails.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No emails sent yet.</td></tr>
                    )}
                    {emails.map((row: any) => (
                      <tr key={row.id} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{row.template_name}</td>
                        <td className="px-3 py-2">{row.recipient_email}</td>
                        <td className="px-3 py-2">
                          <span className={statusBadge(row.status)}>{row.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-md truncate" title={row.error_message ?? ""}>
                          {row.error_message ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
