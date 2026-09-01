import { Link } from "react-router-dom";
import { Bell, Heart, Package, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/hooks/useOrders";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { formatPrice, timeAgo } from "@/lib/utils";

export function AccountOverview() {
  const { profile } = useAuth();
  const { data: orders } = useMyOrders();
  const { data: wishlist } = useWishlist();
  const { data: notifications } = useNotifications();

  const unread = (notifications ?? []).filter((n) => !n.read_at).length;
  const lifetime = (orders ?? []).reduce((a, o) => a + o.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar src={profile?.avatar_url} name={profile?.full_name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Hi, {profile?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-neutral-500">Welcome back to your account.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders placed" value={(orders ?? []).length} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Lifetime spend" value={formatPrice(lifetime)} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Wishlist items" value={(wishlist ?? []).length} icon={<Heart className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent orders</h2>
            <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {(orders ?? []).slice(0, 4).map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="flex items-center justify-between border border-neutral-100 px-3 py-2.5 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-mono text-xs text-neutral-500">{order.order_number}</p>
                  <p className="text-sm font-medium text-neutral-800">{order.seller?.business_name ?? "Store"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-900">{formatPrice(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
            {(orders ?? []).length === 0 && (
              <p className="py-4 text-sm text-neutral-400">No orders yet.</p>
            )}
          </div>
        </section>

        <section className="border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Notifications</h2>
            {unread > 0 && (
              <Link to="/account/notifications" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
                <Bell className="h-3.5 w-3.5" /> {unread} unread
              </Link>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {(notifications ?? []).slice(0, 4).map((n) => (
              <div key={n.id} className="border border-neutral-100 px-3 py-2.5">
                <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                {n.body && <p className="text-xs text-neutral-500">{n.body}</p>}
                <p className="mt-1 text-[11px] text-neutral-400">{timeAgo(n.created_at)}</p>
              </div>
            ))}
            {(notifications ?? []).length === 0 && (
              <p className="py-4 text-sm text-neutral-400">You're all caught up.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
