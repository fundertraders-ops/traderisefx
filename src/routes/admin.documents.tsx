import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, ArrowLeft, RefreshCcw, Download, Trash2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import {
  generateDocumentationPdf,
  listGeneratedDocuments,
  deleteGeneratedDocument,
} from "@/lib/documents.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Generated PDFs — Trade Rise FX Admin" }] }),
  component: AdminDocumentsPage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function AdminDocumentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchList = useServerFn(listGeneratedDocuments);
  const generate = useServerFn(generateDocumentationPdf);
  const remove = useServerFn(deleteGeneratedDocument);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/auth", search: { redirect: "/admin/documents" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const listQ = useQuery({
    queryKey: ["generated-documents"],
    queryFn: () => fetchList(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  // Auto-preview most recent document if none selected
  useEffect(() => {
    if (!previewUrl && listQ.data?.documents?.length) {
      setPreviewUrl(listQ.data.documents[0].signedUrl ?? null);
    }
  }, [listQ.data, previewUrl]);

  const generateMut = useMutation({
    mutationFn: () => generate(),
    onSuccess: (res: any) => {
      toast.success("PDF Generated Successfully and Saved to Admin Panel.");
      if (res?.signedUrl) setPreviewUrl(res.signedUrl);
      qc.invalidateQueries({ queryKey: ["generated-documents"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to generate PDF"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted");
      setPreviewUrl(null);
      qc.invalidateQueries({ queryKey: ["generated-documents"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
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

  const docs = listQ.data?.documents ?? [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Nav />
          <main className="flex-1 pt-28 pb-16">
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <SidebarTrigger className="h-8 w-8 shrink-0" />
                <AdminBreadcrumb currentPage="Generated PDFs" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                    <FileText className="text-gold" /> Generated PDFs
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate, preview, and manage complete platform documentation.
                  </p>
                </div>
                <Button
                  onClick={() => generateMut.mutate()}
                  disabled={generateMut.isPending}
                  className="bg-gold-gradient text-primary-foreground"
                >
                  {generateMut.isPending ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {docs.length > 0 ? "Regenerate PDF" : "Generate Documentation PDF"}
                </Button>
              </div>

              <div className="grid lg:grid-cols-[360px_1fr] gap-4">
                {/* Sidebar list */}
                <div className="rounded-2xl border border-border bg-card/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">Saved documents</h2>
                    <button
                      onClick={() => listQ.refetch()}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Refresh"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
                  {listQ.isLoading ? (
                    <div className="py-8 grid place-items-center">
                      <Loader2 className="animate-spin text-gold h-5 w-5" />
                    </div>
                  ) : docs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No PDFs generated yet. Click "Generate Documentation PDF" above.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                      {docs.map((d: any) => {
                        const active = previewUrl === d.signedUrl;
                        return (
                          <li
                            key={d.id}
                            className={`rounded-lg border p-3 transition ${
                              active
                                ? "border-gold/60 bg-gold/5"
                                : "border-border hover:border-gold/40"
                            }`}
                          >
                            <div className="text-xs text-muted-foreground">
                              {new Date(d.created_at).toLocaleString()}
                            </div>
                            <div className="text-sm font-medium mt-1 line-clamp-2">
                              {d.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {d.page_count} pages · {formatBytes(Number(d.size_bytes ?? 0))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => setPreviewUrl(d.signedUrl)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:border-gold/50"
                              >
                                <Eye className="h-3 w-3" /> View
                              </button>
                              {d.signedUrl && (
                                <a
                                  href={d.signedUrl}
                                  download
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:border-gold/50"
                                >
                                  <Download className="h-3 w-3" /> Download
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm("Delete this PDF?")) deleteMut.mutate(d.id);
                                }}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Preview pane */}
                <div className="rounded-2xl border border-border bg-card/50 p-4 min-h-[70vh] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">Preview</h2>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gold hover:underline"
                      >
                        Open in new tab
                      </a>
                    )}
                  </div>
                  {generateMut.isPending ? (
                    <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-gold h-6 w-6" />
                        Generating PDF...
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <iframe
                      key={previewUrl}
                      src={previewUrl}
                      title="Documentation preview"
                      className="flex-1 w-full rounded-lg border border-border bg-white"
                      style={{ minHeight: "70vh" }}
                    />
                  ) : (
                    <div className="flex-1 grid place-items-center text-sm text-muted-foreground text-center px-6">
                      Generate a documentation PDF to preview it here.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
