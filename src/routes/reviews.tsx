import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Loader2, Quote, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  listPublicReviews,
  listMyReviews,
  submitReview,
} from "@/lib/reviews.functions";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Member Reviews — Trade Rise FX" },
      {
        name: "description",
        content:
          "Read what Trade Rise FX traders have to say and share your own moderated review of our funded account programs.",
      },
    ],
  }),
  component: ReviewsPage,
});

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-1"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            size={26}
            className={
              i <= (hover || value)
                ? "fill-gold text-gold"
                : "text-muted-foreground/40"
            }
          />
        </button>
      ))}
    </div>
  );
}

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? "fill-gold text-gold" : "text-muted-foreground/40"}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={12} /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
        <XCircle size={12} /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
      <Clock size={12} /> Pending review
    </span>
  );
}

function ReviewsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const publicQ = useQuery({
    queryKey: ["public-reviews"],
    queryFn: () => listPublicReviews(),
  });

  const mineQ = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => listMyReviews(),
    enabled: !!user,
  });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submitM = useMutation({
    mutationFn: () =>
      submitReview({
        data: { rating, title: title.trim(), content: content.trim() },
      }),
    onSuccess: () => {
      toast.success("Review submitted — it will appear after moderation.");
      setTitle("");
      setContent("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please add a title and your feedback.");
      return;
    }
    submitM.mutate();
  };

  const reviews = publicQ.data?.reviews ?? [];
  const mine = mineQ.data?.reviews ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-16 px-6">
        <section className="max-w-5xl mx-auto">
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">
              Member reviews
            </span>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">
              Trader feedback & experiences
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Honest reviews from registered Trade Rise FX members. All
              submissions are moderated for authenticity and community
              guidelines.
            </p>
          </div>

          {/* Submit form */}
          <div className="mt-10 rounded-2xl border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">Share your experience</h2>
            {loading ? (
              <div className="mt-4 text-muted-foreground text-sm flex items-center gap-2">
                <Loader2 className="animate-spin" size={14} /> Loading…
              </div>
            ) : !user ? (
              <div className="mt-3 text-sm text-muted-foreground">
                You need to be signed in to leave a review.{" "}
                <Link
                  to="/auth"
                  search={{ mode: "signin", redirect: "/reviews" }}
                  className="text-gold underline"
                >
                  Sign in
                </Link>{" "}
                or{" "}
                <Link
                  to="/auth"
                  search={{ mode: "signup", redirect: "/reviews" }}
                  className="text-gold underline"
                >
                  create an account
                </Link>
                .
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Your rating
                  </label>
                  <div className="mt-1">
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder="Sum up your experience"
                    className="mt-1 w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-gold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Your review
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Tell us about your experience with Trade Rise FX"
                    className="mt-1 w-full px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-gold text-sm"
                    required
                  />
                  <div className="mt-1 text-xs text-muted-foreground text-right">
                    {content.length}/2000
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitM.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold-gradient text-primary-foreground font-semibold text-sm disabled:opacity-60"
                >
                  {submitM.isPending && (
                    <Loader2 className="animate-spin" size={14} />
                  )}
                  Submit review
                </button>
                <p className="text-xs text-muted-foreground">
                  Reviews are visible to the public once approved by our
                  moderation team.
                </p>
              </form>
            )}
          </div>

          {/* My reviews */}
          {user && mine.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold">Your reviews</h2>
              <div className="mt-4 space-y-3">
                {mine.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border bg-card/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <StarsDisplay rating={r.rating} />
                        <span className="font-medium text-sm">{r.title}</span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public approved reviews */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold">All approved reviews</h2>
            {publicQ.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="animate-spin" size={14} /> Loading reviews…
              </div>
            ) : reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No approved reviews yet.
              </p>
            ) : (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-border bg-card/50 p-5"
                  >
                    <Quote className="text-gold/60" size={18} />
                    <StarsDisplay rating={r.rating} />
                    <h3 className="mt-2 font-semibold">{r.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {r.content}
                    </p>
                    <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                      <span>— {r.reviewer_name}</span>
                      <span>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
