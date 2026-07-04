import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Quote, MessageSquarePlus } from "lucide-react";
import { listPublicReviews } from "@/lib/reviews.functions";

function Stars({ rating }: { rating: number }) {
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

export function Reviews() {
  const q = useQuery({
    queryKey: ["public-reviews"],
    queryFn: () => listPublicReviews(),
  });

  const reviews = q.data?.reviews ?? [];

  return (
    <section id="reviews" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">
            Community feedback
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">
            What our traders say
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Real reviews from Trade Rise FX members. All feedback is moderated for authenticity.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center rounded-2xl border border-border bg-card/40 p-10">
            <p className="text-muted-foreground">
              No approved reviews yet. Be the first to share your experience.
            </p>
            <Link
              to="/reviews"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold-gradient text-primary-foreground font-semibold text-sm"
            >
              <MessageSquarePlus size={16} /> Write a review
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.slice(0, 6).map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-border bg-card/50 p-5 flex flex-col"
                >
                  <Quote className="text-gold/60" size={20} />
                  <Stars rating={r.rating} />
                  <h3 className="mt-2 font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground flex-1 line-clamp-5">
                    {r.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                    — {r.reviewer_name}
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-gold/40 text-sm hover:bg-gold/10 transition"
              >
                <MessageSquarePlus size={16} /> View all reviews & share yours
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
