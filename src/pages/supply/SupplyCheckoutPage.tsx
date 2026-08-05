import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, CreditCard, PackageCheck, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useSellerBalance } from "@/hooks/useWithdrawals";
import { supplyImageUrl, useSupplyCouriers, usePlaceSupplyOrder } from "@/hooks/useSupply";
import {
  supplyHasPhysical,
  useSupplyCartStore,
  useSupplyCartSubtotal,
} from "@/store/useSupplyCartStore";
import { Field } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/constants";
import { cn, formatZAR } from "@/lib/utils";
import type { Json } from "@/types/database";

const addressSchema = z.object({
  recipient: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter your street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  province: z.string().min(1, "Select a province"),
  postal_code: z.string().min(4, "Enter your postal code"),
});

type AddressValues = z.infer<typeof addressSchema>;

export function SupplyCheckoutPage() {
  const { profile, isApprovedSeller } = useAuth();
  const items = useSupplyCartStore((s) => s.items);
  const clearCart = useSupplyCartStore((s) => s.clear);
  const subtotal = useSupplyCartSubtotal();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"online" | "eft" | "wallet">("online");
  const [courierId, setCourierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: walletBalance = 0 } = useSellerBalance();

  const placeOrder = usePlaceSupplyOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipient: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      line1: "",
      line2: "",
      city: "",
      province: "",
      postal_code: "",
    },
  });

  const { data: couriers, isLoading: couriersLoading } = useSupplyCouriers();

  const hasPhysical = supplyHasPhysical(items);

  const deliveryFee = useMemo(() => {
    if (!hasPhysical) return 0;
    const courier = couriers?.find((c) => c.id === courierId);
    return courier?.fee ?? 0;
  }, [couriers, courierId, hasPhysical]);

  const total = subtotal + deliveryFee;

  const submit = async (values: AddressValues) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (hasPhysical && !courierId) {
      toast.error("Please select a courier");
      return;
    }
    if (paymentMethod === "wallet" && walletBalance < total) {
      toast.error("Your wallet balance is less than the order total");
      return;
    }
    setSubmitting(true);
    try {
      const order = await placeOrder.mutateAsync({
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        shippingAddress: {
          recipient: values.recipient,
          phone: values.phone,
          line1: values.line1,
          line2: values.line2 || "",
          city: values.city,
          province: values.province,
          postal_code: values.postal_code,
        } as unknown as Json as never,
        courierId: hasPhysical ? courierId : null,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      clearCart();
      navigate("/supplies/order/success", {
        state: {
          orderNumber: order.order_number,
          paymentMethod,
          total: order.total,
          hasPhysical,
        },
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "There was a problem placing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 p-12 text-center">
        <PackageCheck className="mx-auto h-10 w-10 text-neutral-300" />
        <p className="mt-3 font-medium text-neutral-700">Your supply cart is empty</p>
        <Link to="/supplies/shop" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          Browse supplies
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Checkout</h1>

      <form onSubmit={handleSubmit(submit)} className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient full name" error={errors.recipient?.message}>
                <Input placeholder="Nomsa Dlamini" {...register("recipient")} />
              </Field>
              <Field label="Phone number" error={errors.phone?.message}>
                <Input type="tel" placeholder="082 123 4567" {...register("phone")} />
              </Field>
              <Field label="Street address" error={errors.line1?.message} className="sm:col-span-2">
                <Input placeholder="14 Kerk Street" {...register("line1")} />
              </Field>
              <Field label="Address line 2 (optional)">
                <Input placeholder="Unit 5, Sandton" {...register("line2")} />
              </Field>
              <Field label="Postal code" error={errors.postal_code?.message}>
                <Input placeholder="2196" {...register("postal_code")} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input placeholder="Johannesburg" {...register("city")} />
              </Field>
              <Field label="Province" error={errors.province?.message}>
                <Select {...register("province")}>
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          {/* Courier */}
          {hasPhysical && (
            <section className="border border-neutral-200 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
                <Truck className="h-4 w-4 text-neutral-400" /> Courier
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(couriers ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourierId(c.id)}
                    className={cn(
                      "flex items-start justify-between gap-3 border p-4 text-left transition-colors",
                      courierId === c.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">Estimated {c.estimated_days} business days</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">{formatZAR(c.fee)}</span>
                  </button>
                ))}
              </div>
              {couriersLoading && <p className="mt-3 text-xs text-neutral-400">Loading couriers…</p>}
              {!couriersLoading && (couriers ?? []).length === 0 && (
                <p className="mt-3 text-xs text-amber-600">No couriers available right now.</p>
              )}
            </section>
          )}

          {/* Payment */}
          <section className="border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={cn(
                  "flex items-start gap-3 border p-4 text-left transition-colors",
                  paymentMethod === "online"
                    ? "border-brand-500 bg-brand-50"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <CreditCard className="mt-0.5 h-5 w-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">Pay online</p>
                  <p className="text-xs text-neutral-500">Instant confirmation, paid now</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("eft")}
                className={cn(
                  "flex items-start gap-3 border p-4 text-left transition-colors",
                  paymentMethod === "eft"
                    ? "border-brand-500 bg-brand-50"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <Banknote className="mt-0.5 h-5 w-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">Bank transfer (EFT)</p>
                  <p className="text-xs text-neutral-500">We'll confirm once your payment reflects</p>
                </div>
              </button>
              {isApprovedSeller ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={cn(
                    "flex items-start gap-3 border p-4 text-left transition-colors",
                    paymentMethod === "wallet"
                      ? "border-brand-500 bg-brand-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <Wallet className="mt-0.5 h-5 w-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-neutral-900">Pay with balance</p>
                    <p className="text-xs text-neutral-500">
                      Available: {formatZAR(walletBalance)}
                    </p>
                  </div>
                </button>
              ) : null}
            </div>
            {paymentMethod === "eft" && (
              <p className="mt-3 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Bank details will be shown on your order confirmation. Please use your order number as
                the payment reference.
              </p>
            )}
            {paymentMethod === "wallet" && (
              <p className="mt-3 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Your wallet balance will be debited immediately when the order is placed.
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Order notes</h2>
            <Textarea
              className="mt-3"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: delivery instructions, custom requirements…"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit border border-neutral-200 p-5 lg:sticky lg:top-8">
          <h2 className="font-semibold text-neutral-900">Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden bg-neutral-100">
                  {supplyImageUrl(item.image) ? (
                    <img src={supplyImageUrl(item.image)!} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-neutral-800">{item.name}</p>
                  <p className="text-xs text-neutral-400">
                    {item.type === "digital" ? "Digital" : "Physical"} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-medium text-neutral-900">
                  {formatZAR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-1.5 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="text-neutral-900">{formatZAR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery</dt>
              <dd className="text-neutral-900">
                {hasPhysical ? (deliveryFee === 0 ? "Select courier" : formatZAR(deliveryFee)) : "Free"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
              <dt className="text-neutral-900">Total</dt>
              <dd className="text-neutral-900">{formatZAR(total)}</dd>
            </div>
          </dl>

          <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" loading={submitting}>
            {paymentMethod === "wallet"
              ? `Pay with balance · ${formatZAR(total)}`
              : `Place order · ${formatZAR(total)}`}
          </Button>
          <p className="mt-2 text-center text-xs text-neutral-400">
            Digital items unlock instantly after an online or wallet payment.
          </p>
        </aside>
      </form>
    </div>
  );
}
