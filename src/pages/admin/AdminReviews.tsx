import { Star } from "lucide-react";

import { useAllReviews, useSetReviewStatus } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export function AdminReviews() {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useAllReviews();
  const setStatus = useSetReviewStatus();

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading reviews…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reviews</h1>

      {(reviews ?? []).length === 0 ? (
        <EmptyState icon={<Star className="h-8 w-8" />} title="No reviews yet" className="mt-8" />
      ) : (
        <div className="mt-6 space-y-4">
          {(reviews ?? []).map((review) => (
            <div key={review.id} className="rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar src={review.user?.avatar_url} name={review.user?.full_name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {review.user?.full_name ?? "Anonymous"}
                      {review.user?.id === user?.id ? " (you)" : ""}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Rating value={review.rating} size="sm" />
                      <span className="text-xs text-neutral-400">{formatDate(review.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">{review.body ?? "No comment."}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      On {review.product?.name ?? "deleted product"} ·{" "}
                    <Badge
                      tone={
                        review.status === "approved" ? "green" : review.status === "rejected" ? "red" : "amber"
                      }
                    >
                      {review.status}
                    </Badge>
                    </p>
                  </div>
                </div>
                {review.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void setStatus.mutateAsync({ id: review.id, status: "rejected" })}
                  >
                    Hide
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
