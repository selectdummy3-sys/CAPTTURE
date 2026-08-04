import { useAdminSupplyStats } from "@/hooks/useSupply";
import { StatCard } from "@/components/ui/stat-card";
import { formatZAR } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, Tag, AlertTriangle } from "lucide-react";

export function AdminSupplyOverview() {
  const { data: stats, isLoading } = useAdminSupplyStats();

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-neutral-400">Loading supply stats…</p>;
  }

  const s = stats ?? {
    totalRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    revenue30d: 0,
    productsCount: 0,
    activeProducts: 0,
    lowStockCount: 0,
    categoriesCount: 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Supplies Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatZAR(s.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Total Orders"
          value={String(s.totalOrders)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          label="Active Products"
          value={String(s.activeProducts)}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Categories"
          value={String(s.categoriesCount)}
          icon={<Tag className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Paid Orders"
          value={String(s.paidOrders)}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          label="Pending Orders"
          value={String(s.pendingOrders)}
          icon={<ShoppingCart className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          label="Revenue (30d)"
          value={formatZAR(s.revenue30d)}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Low Stock"
          value={String(s.lowStockCount)}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />
      </div>
    </div>
  );
}
