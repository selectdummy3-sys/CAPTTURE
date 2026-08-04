import { Users } from "lucide-react";

import { useSellerFollowers, useFollowerGrowth } from "@/hooks/useSellerDashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

function GrowthChart({ data }: { data: Array<{ date: string; value: number }> }) {
  if (data.length === 0) return <p className="text-sm text-neutral-400">No follower activity yet.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-40 items-end gap-1">
      {data.slice(-30).map((d) => (
        <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.value} new`}>
          <div
            className="w-full bg-brand-200 transition-colors group-hover:bg-brand-500"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

export function SellerFollowers() {
  const { data: followers = [], isLoading } = useSellerFollowers();
  const { data: growth = [], isLoading: growthLoading } = useFollowerGrowth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Followers</h1>
        <p className="text-sm text-neutral-500">People who follow your store and see your new drops.</p>
      </div>

      <section className="border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Follower growth</h2>
          <p className="text-sm text-neutral-500">{followers.length} followers</p>
        </div>
        <div className="mt-4">
          {growthLoading ? <Skeleton className="h-40 w-full" /> : <GrowthChart data={growth} />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">All followers</h2>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-neutral-100" />
            ))}
          </div>
        ) : followers.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Users className="h-8 w-8" />}
            title="No followers yet"
            description="Share your store link to grow your following."
          />
        ) : (
          <div className="mt-4 divide-y divide-neutral-100 border border-neutral-200 bg-white">
            {followers.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-neutral-100">
                    {f.user?.avatar_url ? (
                      <img src={f.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {f.user?.full_name ?? "Anonymous follower"}
                    </p>
                    <p className="text-xs text-neutral-400">Following since {formatDate(f.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}