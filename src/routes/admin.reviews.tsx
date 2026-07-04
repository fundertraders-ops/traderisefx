import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  MessageSquare,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import {
  adminListReviews,
  moderateReview,
  deleteReview,
} from "@/lib/reviews.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Trade Rise FX Admin" }] }),
  component: AdminReviewsPage,
});

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating ? "fill-gold text-gold" : "text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

function AdminReviewsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/auth", search: { redirect: "/admin/reviews" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const [status, setStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  const listQ = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () => adminListReviews({ data: { status } }),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const modM = useMutation({
    mutationFn: (vars: {
      id: string;
      action: "approve" | "reject";
      notes?: string | null;
    }) => moderateReview({ data: vars }),
    onSuccess: () => {
      toast.success("Review updated");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["public-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["public-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 text-sm text-gold"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const reviews = listQ.data?.reviews ?? [];

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
                <AdminBreadcrumb currentPage="Reviews" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">
                    Moderation
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-bold inline-flex items-center gap-2">
                    <MessageSquare className="text-gold" /> Member reviews
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {(["pending", "approved", "rejected", "all"] as const).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1.5 rounded-md border ${
                          status === s
                            ? "border-gold text-gold"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s[0].toUpperCase() + s.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {listQ.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" size={14} /> Loading…
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviews in this view.
                  </p>
                ) : (
                  reviews.map((r) => (
                    <ReviewRow
                      key={r.id}
                      r={r}
                      onApprove={(notes) =>
                        modM.mutate({ id: r.id, action: "approve", notes })
                      }
                      onReject={(notes) =>
                        modM.mutate({ id: r.id, action: "reject", notes })
                      }
                      onDelete={() => {
                        if (confirm("Delete this review permanently?"))
                          delM.mutate(r.id);
                      }}
                      working={modM.isPending || delM.isPending}
                    />
                  ))
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

function ReviewRow({
  r,
  onApprove,
  onReject,
  onDelete,
  working,
}: {
  r: {
    id: string;
    user_id: string;
    rating: number;
    title: string;
    content: string;
    status: string;
    moderation_notes: string | null;
    created_at: string;
    reviewer_email: string;
    reviewer_name: string;
  };
  onApprove: (notes: string | null) => void;
  onReject: (notes: string | null) => void;
  onDelete: () => void;
  working: boolean;
}) {
  const [notes, setNotes] = useState(r.moderation_notes ?? "");
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StarsDisplay rating={r.rating} />
            <span className="font-semibold">{r.title}</span>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                r.status === "approved"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : r.status === "rejected"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {r.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {r.reviewer_name || "—"} ·{" "}
            <span className="font-mono">{r.reviewer_email}</span> ·{" "}
            {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm whitespace-pre-wrap">{r.content}</p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional moderator note"
          maxLength={500}
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-md bg-background border border-border text-xs"
        />
        <button
          onClick={() => onApprove(notes.trim() || null)}
          disabled={working}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs disabled:opacity-60"
        >
          <CheckCircle2 size={14} /> Approve
        </button>
        <button
          onClick={() => onReject(notes.trim() || null)}
          disabled={working}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-xs disabled:opacity-60"
        >
          <XCircle size={14} /> Reject
        </button>
        <button
          onClick={onDelete}
          disabled={working}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs disabled:opacity-60"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
