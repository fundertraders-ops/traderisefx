import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, ArrowLeft, ImageIcon, Search, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  listTradeResults,
  createTradeResult,
  deleteTradeResult,
  checkIsAdmin,
} from "@/lib/trade-results.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/trade-results")({
  head: () => ({ meta: [{ title: "Trade Results — Trade Rise FX Admin" }] }),
  component: AdminTradeResultsPage,
});

function AdminTradeResultsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/trade-results" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterTradeDate, setFilterTradeDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "public" | "targeted">("all");
  const [showFilters, setShowFilters] = useState(false);

  const listQ = useQuery({
    queryKey: [
      "trade-results",
      searchQuery.trim() || null,
      filterUserId.trim() || null,
      filterTradeDate || null,
      filterStatus,
    ],
    queryFn: () =>
      listTradeResults({
        data: {
          search: searchQuery.trim() || null,
          userId: filterUserId.trim() || null,
          tradeDate: filterTradeDate || null,
          status: filterStatus,
        },
      }),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an image");
      if (!title.trim()) throw new Error("Add a title");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) throw new Error("Pick a trade date");
      if (!file.type.startsWith("image/")) throw new Error("File must be an image");
      if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8MB");
      if (targetUserId && !/^[0-9a-f-]{36}$/i.test(targetUserId.trim()))
        throw new Error("Target user ID must be a valid UUID");

      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("trade-results").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) throw new Error(up.error.message);

      try {
        await createTradeResult({
          data: {
            title: title.trim(),
            caption: caption.trim() || null,
            imagePath: path,
            userId: targetUserId.trim() || null,
            tradeDate,
          },
        });
      } catch (e) {
        await supabase.storage.from("trade-results").remove([path]);
        throw e;
      }
    },
    onSuccess: () => {
      toast.success("Trade result uploaded");
      setTitle("");
      setCaption("");
      setTargetUserId("");
      setTradeDate(new Date().toISOString().slice(0, 10));
      setFile(null);
      qc.invalidateQueries({ queryKey: ["trade-results"] });
      qc.invalidateQueries({ queryKey: ["dashboard-trade-results"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
    onSettled: () => setUploading(false),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTradeResult({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["trade-results"] });
      qc.invalidateQueries({ queryKey: ["dashboard-trade-results"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
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

  const results = listQ.data?.results ?? [];

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
                <AdminBreadcrumb currentPage="Trade Results" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                  <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">Trade Rise FX trade results</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload trade screenshots for all Trade Rise FX users, or target a specific user by ID.
                  </p>
                </div>
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Trade Rise FX dashboard</span><span className="sm:hidden">Dashboard</span>
                </Link>
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
                <h2 className="font-bold">Upload new Trade Rise FX result</h2>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <input
                    className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
                    placeholder="Title (e.g. EUR/USD Long +2.4%)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                  <input
                    type="date"
                    className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    required
                  />
                  <input
                    className="sm:col-span-2 h-11 rounded-lg border border-border bg-background px-3 text-sm"
                    placeholder="Target user ID (optional — leave blank for all users)"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                  />
                  <textarea
                    className="sm:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Caption (optional)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                  />
                  <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-dashed border-border bg-background/50 px-4 py-3 text-sm cursor-pointer hover:border-gold/40">
                    <Upload size={16} className="text-gold" />
                    <span className="truncate">{file ? file.name : "Choose screenshot (PNG/JPG, ≤ 8MB)"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <button
                  onClick={() => uploadMut.mutate()}
                  disabled={uploading}
                  className="mt-4 h-11 px-5 rounded-lg bg-gold-gradient text-primary-foreground font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {uploading && <Loader2 size={16} className="animate-spin" />} Upload Trade Rise FX result
                </button>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="font-bold">All Trade Rise FX trade results</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters((s) => !s)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted transition"
                    >
                      <Filter size={14} /> Filters
                    </button>
                    {(searchQuery || filterUserId || filterTradeDate || filterStatus !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterUserId("");
                          setFilterTradeDate("");
                          setFilterStatus("all");
                        }}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted transition text-muted-foreground"
                      >
                        <X size={14} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-card/40">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm"
                        placeholder="Search title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <input
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      placeholder="Filter by user ID..."
                      value={filterUserId}
                      onChange={(e) => setFilterUserId(e.target.value)}
                    />
                    <input
                      type="date"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      placeholder="Trade date"
                      value={filterTradeDate}
                      onChange={(e) => setFilterTradeDate(e.target.value)}
                    />
                    <select
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as "all" | "public" | "targeted")}
                    >
                      <option value="all">All statuses</option>
                      <option value="public">Public</option>
                      <option value="targeted">Targeted</option>
                    </select>
                  </div>
                )}

                {listQ.isLoading ? (
                  <div className="mt-4 grid place-items-center py-12"><Loader2 className="animate-spin text-gold" /></div>
                ) : results.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {searchQuery || filterUserId || filterTradeDate || filterStatus !== "all"
                      ? "No Trade Rise FX trade results match your filters."
                      : "No Trade Rise FX trade results uploaded yet."}
                  </p>
                ) : (
                  <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-border bg-card/50 overflow-hidden">
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.title} className="w-full aspect-video object-cover" />
                        ) : (
                          <div className="w-full aspect-video grid place-items-center bg-muted">
                            <ImageIcon className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{r.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Trade date: {new Date(r.trade_date + "T00:00:00").toLocaleDateString()} · Uploaded {new Date(r.created_at).toLocaleString()} · {r.user_id ? "Targeted" : "Public"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm("Delete this Trade Rise FX trade result?")) deleteMut.mutate(r.id);
                              }}
                              className="shrink-0 p-2 rounded-md border border-border hover:border-destructive/60 hover:text-destructive transition"
                              aria-label="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {r.caption && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.caption}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
