import { usePlatformStats } from "@/hooks/useAdmin";
import { StatCard } from "@/components/ui/stat-card";
import { formatCompactZAR } from "@/lib/utils";

export function AdminDashboard() {
  const { data: stats, isLoading } = usePlatformStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Platform overview</h1>
        <p className="text-sm text-neutral-500">Everything happening on CAPPTURE.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCompactZAR(stats?.revenue ?? 0)} loading={isLoading} />
        <StatCard label="Orders" value={stats?.orders ?? 0} loading={isLoading} />
        <StatCard label="Customers" value={stats?.customers ?? 0} loading={isLoading} />
        <StatCard label="Products" value={stats?.products ?? 0} loading={isLoading} />
        <StatCard label="Sellers" value={stats?.sellers ?? 0} loading={isLoading} />
        <StatCard label="Approved sellers" value={stats?.approvedSellers ?? 0} loading={isLoading} />
        <StatCard label="Pending orders" value={stats?.pendingOrders ?? 0} loading={isLoading} />
        <StatCard label="Reviews" value={stats?.reviews ?? 0} loading={isLoading} />
      </div>
    </div>
  );
}
