import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/types/database";

export interface AnalyticsDataPoint {
  date: string;
  value: number;
}

export interface SellerAnalytics {
  dailySales: AnalyticsDataPoint[];
  weeklySales: AnalyticsDataPoint[];
  monthlySales: AnalyticsDataPoint[];
  revenue: AnalyticsDataPoint[];
  ordersOverTime: AnalyticsDataPoint[];
  productViews: AnalyticsDataPoint[];
  storeVisits: AnalyticsDataPoint[];
  conversionRate: number;
  bestSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export function useSellerAnalytics() {
  const { seller } = useAuth();
  const enabled = Boolean(seller);

  const dailySales = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "daily-sales", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_daily_sales", {
        p_seller_id: seller!.id,
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const weeklySales = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "weekly-sales", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_weekly_sales", {
        p_seller_id: seller!.id,
        p_weeks: 12,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const monthlySales = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "monthly-sales", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_monthly_sales", {
        p_seller_id: seller!.id,
        p_months: 12,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const revenue = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "revenue", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_revenue_over_time", {
        p_seller_id: seller!.id,
        p_days: 90,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const ordersOverTime = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "orders-over-time", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_orders_over_time", {
        p_seller_id: seller!.id,
        p_days: 90,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const productViews = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "product-views", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_product_views", {
        p_seller_id: seller!.id,
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const storeVisits = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-analytics", "store-visits", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_store_visits", {
        p_seller_id: seller!.id,
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const conversionRate = useQuery<number>({
    queryKey: ["seller-analytics", "conversion-rate", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_conversion_rate", {
        p_seller_id: seller!.id,
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? 0) as number;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const bestSellingProducts = useQuery({
    queryKey: ["seller-analytics", "best-selling", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_best_selling_products", {
        p_seller_id: seller!.id,
        p_limit: 10,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        sales: number;
        revenue: number;
      }>;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    dailySales,
    weeklySales,
    monthlySales,
    revenue,
    ordersOverTime,
    productViews,
    storeVisits,
    conversionRate,
    bestSellingProducts,
    isLoading: enabled && (
      dailySales.isLoading ||
      weeklySales.isLoading ||
      monthlySales.isLoading ||
      revenue.isLoading ||
      ordersOverTime.isLoading ||
      productViews.isLoading ||
      storeVisits.isLoading ||
      conversionRate.isLoading ||
      bestSellingProducts.isLoading
    ),
  };
}

export interface FollowerData {
  id: string;
  user_id: string;
  seller_id: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useSellerFollowers() {
  const { seller } = useAuth();
  return useQuery<FollowerData[]>({
    queryKey: ["seller-followers", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data, error } = await supabase
        .from("store_followers")
        .select("*, user:profiles(id, full_name, avatar_url)")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FollowerData[];
    },
    enabled: Boolean(seller),
  });
}

export function useFollowerGrowth() {
  const { seller } = useAuth();
  return useQuery<AnalyticsDataPoint[]>({
    queryKey: ["seller-followers", "growth", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data, error } = await supabase.rpc("get_seller_follower_growth", {
        p_seller_id: seller.id,
        p_days: 90,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDataPoint[];
    },
    enabled: Boolean(seller),
    staleTime: 5 * 60 * 1000,
  });
}

export interface EarningsData {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  marketplaceCommission: number;
  nextPayoutDate: string | null;
}

export function useSellerEarnings() {
  const { seller } = useAuth();
  return useQuery<EarningsData>({
    queryKey: ["seller-earnings", seller?.id],
    queryFn: async () => {
      if (!seller) return { availableBalance: 0, pendingBalance: 0, totalEarnings: 0, marketplaceCommission: 0, nextPayoutDate: null };
      const { data, error } = await supabase.rpc("get_seller_earnings", {
        p_seller_id: seller.id,
      });
      if (error) throw error;
      return (data ?? { availableBalance: 0, pendingBalance: 0, totalEarnings: 0, marketplaceCommission: 0, nextPayoutDate: null }) as unknown as EarningsData;
    },
    enabled: Boolean(seller),
  });
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  created_at: string;
  processed_at: string | null;
  bank_snapshot: Json;
}

export function useSellerPayoutHistory() {
  const { seller } = useAuth();
  return useQuery<PayoutHistoryItem[]>({
    queryKey: ["seller-payout-history", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutHistoryItem[];
    },
    enabled: Boolean(seller),
  });
}

export interface SellerNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
}

export function useSellerNotifications() {
  const { seller } = useAuth();
  return useQuery<SellerNotification[]>({
    queryKey: ["seller-notifications", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", seller.user_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as SellerNotification[];
    },
    enabled: Boolean(seller),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller-notifications"] });
      void qc.invalidateQueries({ queryKey: ["seller", "unread-notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller-notifications"] });
      void qc.invalidateQueries({ queryKey: ["seller", "unread-notifications"] });
    },
  });
}

export function useUnreadNotificationCount() {
  const { seller } = useAuth();
  return useQuery<number>({
    queryKey: ["seller", "unread-notifications", seller?.user_id],
    queryFn: async () => {
      if (!seller) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", seller.user_id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(seller),
    refetchInterval: 60000,
  });
}

export function useLowStockProducts() {
  const { seller } = useAuth();
  return useQuery({
    queryKey: ["seller-low-stock", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, featured_image, status")
        .eq("seller_id", seller.id)
        .eq("status", "published")
        .lte("stock", 5)
        .gt("stock", 0)
        .order("stock", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(seller),
  });
}

export function useTodaySales() {
  const { seller } = useAuth();
  return useQuery<{ today: number; yesterday: number }>({
    queryKey: ["seller-stats", "today-sales", seller?.id],
    queryFn: async () => {
      if (!seller) return { today: 0, yesterday: 0 };
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("seller_id", seller.id)
        .gte("created_at", yesterday)
        .in("status", ["paid", "processing", "shipped", "delivered"]);
      if (error) throw error;
      let todayTotal = 0;
      let yesterdayTotal = 0;
      for (const order of data ?? []) {
        if (order.created_at.slice(0, 10) >= today) todayTotal += order.total;
        else yesterdayTotal += order.total;
      }
      return { today: todayTotal, yesterday: yesterdayTotal };
    },
    enabled: Boolean(seller),
    refetchInterval: 60000,
  });
}

export function useMonthlyRevenue() {
  const { seller } = useAuth();
  return useQuery<number>({
    queryKey: ["seller-stats", "monthly-revenue", seller?.id],
    queryFn: async () => {
      if (!seller) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("total")
        .eq("seller_id", seller.id)
        .gte("created_at", startOfMonth.toISOString())
        .in("status", ["delivered", "shipped", "processing", "paid"]);
      if (error) throw error;
      return (data ?? []).reduce((acc, o) => acc + o.total, 0);
    },
    enabled: Boolean(seller),
    refetchInterval: 60000,
  });
}

export function useStoreViews() {
  const { seller } = useAuth();
  return useQuery<number>({
    queryKey: ["seller-stats", "store-views", seller?.id],
    queryFn: async () => {
      if (!seller) return 0;
      const { data, error } = await supabase.rpc("get_seller_store_visits", {
        p_seller_id: seller.id,
        p_days: 30,
      });
      if (error) throw error;
      return (data ?? []).reduce((acc, d) => acc + d.value, 0);
    },
    enabled: Boolean(seller),
    refetchInterval: 300000,
  });
}