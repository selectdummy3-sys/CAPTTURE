import { useState, type FormEvent } from "react";
import { Loader2, Ticket } from "lucide-react";

import { useCoupons, useCreateCoupon } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/form/Field";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatZAR } from "@/lib/utils";

export function AdminCoupons() {
  const { data: coupons, isLoading } = useCoupons();
  const create = useCreateCoupon();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (!code.trim()) throw new Error("Coupon code is required.");
      if (!value || Number(value) <= 0) throw new Error("Discount value is required.");
      await create.mutateAsync({
        code,
        description,
        discountType,
        discountValue: Number(value),
        minOrderAmount: minOrder ? Number(minOrder) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive,
        endsAt: endsAt || undefined,
      });
      setCode("");
      setDescription("");
      setValue("");
      setMinOrder("");
      setUsageLimit("");
      setEndsAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Coupons</h1>

      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-neutral-200 p-5">
        <p className="text-sm font-semibold text-neutral-900">Create coupon</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE10" required />
          </Field>
          <Field label="Type">
            <Select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </Select>
          </Field>
          <Field label="Value">
            <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" required />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Min order (ZAR)">
            <Input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} inputMode="numeric" placeholder="0" />
          </Field>
          <Field label="Usage limit">
            <Input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} inputMode="numeric" placeholder="Unlimited" />
          </Field>
          <Field label="Ends at">
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex items-end pb-1">
            <div className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-2">
              <span className="text-sm text-neutral-700">Active</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={create.isPending} className="mt-4">
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create coupon
        </Button>
      </form>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Loading coupons…</p>
      ) : (coupons ?? []).length === 0 ? (
        <EmptyState icon={<Ticket className="h-8 w-8" />} title="No coupons yet" className="mt-8" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(coupons ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-neutral-900">{c.code}</span>
                    {c.description && <p className="text-xs text-neutral-400">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : formatZAR(c.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {c.used_count}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{c.ends_at ? formatDate(c.ends_at) : "Never"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.is_active ? "green" : "neutral"}>{c.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
