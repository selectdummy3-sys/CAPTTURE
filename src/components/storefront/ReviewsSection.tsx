import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useProductReviews } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import type { ProductWithDetails } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Rating, RatingInput } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/Field";
import { timeAgo } from "@/lib/utils";

export function ReviewsSection({ product }: { product: ProductWithDetails }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useProductReviews(product.id);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasReviewed = (reviews ?? []).some((r) => r.user_id === user?.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${product.slug}`)}`);
      return;
    }
    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").upsert(
      {
        product_id: product.id,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
      },
      { onConflict: "product_id,user_id" }
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks for your review");
    setRating(0);
    setTitle("");
    setBody("");
    await queryClient.invalidateQueries({ queryKey: ["product-reviews", product.id] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const avg = reviews?.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <section className="mt-16 border-t border-neutral-200 pt-10" id="reviews">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Reviews</h2>
          <div className="mt-1 flex items-center gap-2">
            <Rating value={avg} size="md" />
            <span className="text-sm text-neutral-500">
              {reviews?.length ?? 0} review{reviews?.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[380px_1fr]">
        {/* Review form */}
        <div className="h-fit rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900">
            {hasReviewed ? "Update your review" : "Write a review"}
          </h3>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <Field label="Your rating">
              <RatingInput value={rating} onChange={setRating} />
            </Field>
            <Field label="Title" hint="Optional">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Great quality, fits true to size" />
            </Field>
            <Field label="Review" hint="Optional">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What did you like or dislike?" />
            </Field>
            <Button type="submit" className="w-full" loading={submitting} disabled={!user}>
              {user ? "Submit review" : "Sign in to review"}
            </Button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-neutral-400">Loading reviews…</p>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-neutral-100 pb-6 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={review.user?.avatar_url} name={review.user?.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{review.user?.full_name ?? "Verified buyer"}</p>
                      <p className="text-xs text-neutral-400">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <Rating value={review.rating} size="sm" />
                </div>
                {review.title && <p className="mt-3 text-sm font-semibold text-neutral-900">{review.title}</p>}
                {review.body && <p className="mt-1 text-sm text-neutral-600">{review.body}</p>}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Star className="h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">No reviews yet. Be the first to share your experience.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
