import { Link } from "react-router-dom";
import { ArrowRight, Package, AlertTriangle, Bell, Users, Eye, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useSellerOrders, useSellerStats } from "@/hooks/useOrders";
import {
  useTodaySales,
  useMonthlyRevenue,
  useStoreViews,
  useLowStockProducts,
  useSellerNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useSellerDashboard";
import { StatCard } from "@/components/ui/stat-card";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button";
import { formatCompactZAR, formatDate, formatZAR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SellerDashboard() {
  const { seller } = useAuth();
  const stats = useSellerStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useSellerOrders();
  const todaySales = useTodaySales();
  const today = todaySales.data?.today ?? 0;
  const yesterday = todaySales.data?.yesterday ?? 0;
  const delta =
    yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : null;
  const monthlyRevenue = useMonthlyRevenue();
  const storeViews = useStoreViews();
  const lowStock = useLowStockProducts();
  const notifications = useSellerNotifications();
  const unreadCount = useUnreadNotificationCount();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">Welcome back to {seller?.business_name}.</p>
        </div>
        <Link to="/seller/products/new" className={buttonClass("primary", "sm")}>
          + New product
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={formatCompactZAR(today)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          hint={delta != null ? (delta >= 0 ? "+" : "") + delta + "% vs yesterday" : undefined}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCompactZAR(monthlyRevenue.data ?? 0)}
          icon={<TrendingUp className="h-5 w-5 text-brand-600" />}
        />
        <StatCard
          label="Total Orders"
          value={stats.orders}
          icon={<ShoppingBag className="h-5 w-5 text-purple-600" />}
        />
        <StatCard
          label="Active Products"
          value={stats.published}
          icon={<Package className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          label="Store Views (30d)"
          value={storeViews.data ?? 0}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          label="Followers"
          value={stats.followers}
          icon={<Users className="h-5 w-5 text-pink-600" />}
        />
        {lowStock.data && lowStock.data.length > 0 && (
          <StatCard
            label="Low Stock Alert"
            value={lowStock.data.length}
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            hint="Products needing restock"
          />
        )}
        <StatCard
          label="Unread Notifications"
          value={unreadCount.data ?? 0}
          icon={<Bell className="h-5 w-5 text-indigo-600" />}
        />
      </div>

      {/* Low Stock Alert Section */}
      {lowStock.data && lowStock.data.length > 0 && (
        <section className="border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between border-b border-amber-200/50 px-5 py-3">
            <h2 className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Products
            </h2>
            <Link
              to="/seller/products?tab=published"
              className="text-sm text-amber-700 hover:underline"
            >
              View all {lowStock.data.length} products
            </Link>
          </div>
          <div className="divide-y divide-amber-200/50">
            {lowStock.data.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden bg-neutral-100">
                    {product.featured_image ? (
                      <img src={product.featured_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-neutral-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                    <p className="text-xs text-amber-700">Only {product.stock} left in stock</p>
                  </div>
                </div>
                <Link
                  to={`/seller/products/${product.id}/edit`}
                  className={buttonClass("outline", "sm")}
                >
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <section className="border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
            <Link to="/seller/orders" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {ordersLoading ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-neutral-400">Loading…</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Package className="mx-auto h-6 w-6 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-400">No orders yet.</p>
              </div>
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to="/seller/orders"
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-neutral-400">{order.order_number}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                      {order.user?.full_name ?? "Customer"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{formatZAR(order.total)}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent Notifications */}
        <section className="border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
              <Bell className="h-5 w-5" />
              Recent Notifications
              {unreadCount.data && unreadCount.data > 0 && (
                <span className="bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount.data}</span>
              )}
            </h2>
            <Link to="/seller/notifications" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {(notifications.data ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell className="mx-auto h-6 w-6 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-400">No notifications yet.</p>
              </div>
            ) : (
              (notifications.data ?? []).slice(0, 5).map((n) => (
                <div key={n.id} className={cn("px-5 py-3", !n.read_at && "bg-brand-50/40")}>
                  <p className={cn("text-sm font-medium text-neutral-900", !n.read_at && "font-semibold")}>
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}