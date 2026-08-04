import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, DollarSign, Eye, ShoppingBag, UserCheck } from "lucide-react";

import { useSellerAnalytics, type AnalyticsDataPoint } from "@/hooks/useSellerDashboard";
import { StatCard } from "@/components/ui/stat-card";
import { formatCompactZAR, formatZAR } from "@/lib/utils";

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 0,
  border: "1px solid #e5e5e5",
} as const;

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-neutral-200 bg-white p-5">
      <h2 className="font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4 h-56">{children}</div>
    </section>
  );
}

function RevenueChart({ data }: { data: AnalyticsDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [formatZAR(Number(value)), "Revenue"]}
          labelStyle={{ fontWeight: 600, color: "#171717" }}
        />
        <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SalesChart({ data }: { data: AnalyticsDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [formatZAR(Number(value)), "Sales"]}
          labelStyle={{ fontWeight: 600, color: "#171717" }}
        />
        <Bar dataKey="value" fill="#0d9488" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CountChart({ data, label }: { data: AnalyticsDataPoint[]; label: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [Number(value), label]}
          labelStyle={{ fontWeight: 600, color: "#171717" }}
        />
        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SellerAnalytics() {
  const {
    dailySales,
    weeklySales,
    monthlySales,
    revenue,
    ordersOverTime,
    productViews,
    storeVisits,
    conversionRate,
    bestSellingProducts,
    isLoading,
  } = useSellerAnalytics();

  const totalRevenue = (revenue.data ?? []).reduce((acc, d) => acc + d.value, 0);
  const totalOrders = (ordersOverTime.data ?? []).reduce((acc, d) => acc + d.value, 0);
  const totalViews = (productViews.data ?? []).reduce((acc, d) => acc + d.value, 0);
  const totalVisits = (storeVisits.data ?? []).reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <p className="text-sm text-neutral-500">Track your store's performance over time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (90d)"
          value={formatCompactZAR(totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Orders (90d)"
          value={totalOrders}
          icon={<ShoppingBag className="h-5 w-5 text-brand-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Product views (30d)"
          value={totalViews}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          loading={isLoading}
        />
        <StatCard
          label="Store visits (30d)"
          value={totalVisits}
          icon={<UserCheck className="h-5 w-5 text-pink-600" />}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily sales (30d)">
          <SalesChart data={dailySales.data ?? []} />
        </ChartCard>
        <ChartCard title="Revenue trend (90d)">
          <RevenueChart data={revenue.data ?? []} />
        </ChartCard>
        <ChartCard title="Orders (90d)">
          <CountChart data={ordersOverTime.data ?? []} label="Orders" />
        </ChartCard>
        <ChartCard title="Store visits (30d)">
          <CountChart data={storeVisits.data ?? []} label="Visits" />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">Conversion rate</h2>
          <p className="mt-1 text-sm text-neutral-500">Orders ÷ store visits over the last 30 days.</p>
          <p className="mt-4 text-3xl font-bold text-neutral-900">
            {isLoading ? "—" : `${(conversionRate.data ?? 0).toFixed(2)}%`}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {totalOrders} orders from {totalVisits} store visits
          </p>
        </section>

        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">Best selling products</h2>
          <div className="mt-4 space-y-3">
            {(bestSellingProducts.data ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400">No sales data yet.</p>
            ) : (
              (bestSellingProducts.data ?? []).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center bg-neutral-100 text-xs font-semibold text-neutral-500">
                      {i + 1}
                    </span>
                    <p className="truncate font-medium text-neutral-900">{p.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-xs text-neutral-500">
                    <span>{p.sales} sold</span>
                    <span className="w-20 text-right font-semibold text-neutral-900">{formatZAR(p.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weekly sales (12w)">
          <SalesChart data={weeklySales.data ?? []} />
        </ChartCard>
        <ChartCard title="Monthly sales (12m)">
          <SalesChart data={monthlySales.data ?? []} />
        </ChartCard>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
        <BarChart3 className="h-3.5 w-3.5" />
        Charts update every few minutes. View and store-visit figures are estimates.
      </p>
    </div>
  );
}