import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/usePermissions";
import type { AdminRole } from "@/lib/permissions";

export interface WorkQueueSupportItem {
  id: string;
  reference: string | null;
  subject: string | null;
  priority: string;
  status: string;
  source: string;
  assigned_to_me: boolean;
  unassigned: boolean;
  overdue: boolean;
  age_hours: number;
}

export interface WorkQueueSupport {
  open: number;
  unassigned: number;
  mine: number;
  urgent: number;
  overdue: number;
  ai: number;
  items: WorkQueueSupportItem[];
}

export interface WorkQueueFulfilmentItem {
  id: string;
  order_number: string | null;
  status: string;
  payment_status: string;
  delivery_method: string;
  total: number;
  delayed: boolean;
  exception: boolean;
  age_hours: number;
}

export interface WorkQueueFulfilment {
  to_process: number;
  awaiting_payment: number;
  delayed: number;
  exceptions: number;
  items: WorkQueueFulfilmentItem[];
}

export interface WorkQueueFinancePayoutItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  overdue: boolean;
  age_hours: number;
}

export interface WorkQueueFinanceOrderItem {
  id: string;
  order_number: string | null;
  total: number;
  created_at: string;
  age_hours: number;
}

export interface WorkQueueFinancePaymentItem {
  id: number;
  payment_ref: string;
  amount: number;
  status: string;
  created_at: string;
  age_hours: number;
}

export interface WorkQueueFinance {
  can_reconcile: boolean;
  can_refund: boolean;
  can_payout: boolean;
  unreconciled: number | null;
  exceptions: number | null;
  refund_reviews: number | null;
  payout_requests: number | null;
  payouts_overdue: number | null;
  commissions_pending: number | null;
  items: {
    payouts: WorkQueueFinancePayoutItem[] | null;
    refunds: WorkQueueFinanceOrderItem[] | null;
    payments: WorkQueueFinancePaymentItem[] | null;
  };
}

export interface WorkQueueSellerApplicationItem {
  id: string;
  business_name: string | null;
  province: string | null;
  created_at: string;
  age_hours: number;
}

export interface WorkQueueSellers {
  applications_pending: number;
  suspended: number;
  products_pending: number | null;
  can_moderate: boolean;
  items: { applications: WorkQueueSellerApplicationItem[] };
}

export interface WorkQueueAlert {
  kind: string;
  severity: "high" | "medium" | string;
  title: string;
  count: number;
  href: string;
}

export interface WorkQueue {
  role: AdminRole | null;
  generated_at: string;
  support: WorkQueueSupport | null;
  fulfilment: WorkQueueFulfilment | null;
  finance: WorkQueueFinance | null;
  sellers: WorkQueueSellers | null;
  alerts: WorkQueueAlert[];
}

const EMPTY_QUEUE: WorkQueue = {
  role: null,
  generated_at: "",
  support: null,
  fulfilment: null,
  finance: null,
  sellers: null,
  alerts: [],
};

/**
 * Server-enforced, permission-scoped operational queue for the current staff
 * member. The database returns only the sections this user is permitted to see
 * (null for everything else), so the client never has to filter for security.
 */
export function useWorkQueue() {
  const { user } = useAuth();
  const { access } = useAdminAccess();

  return useQuery({
    queryKey: ["admin", "work-queue", user?.id],
    enabled: Boolean(user) && access.isStaff,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    queryFn: async (): Promise<WorkQueue> => {
      const { data, error } = await supabase.rpc("admin_work_queue");
      if (error) throw error;
      return { ...EMPTY_QUEUE, ...((data ?? {}) as unknown as WorkQueue) };
    },
  });
}
