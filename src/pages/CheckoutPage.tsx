import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Field } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/constants";
import { formatZAR } from "@/lib/utils";
import type { Json } from "@/types/database";

const FREE_SHIPPING_ABOVE = 1000;
const SHIPPING_FEE = 60;

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

interface CheckoutGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
}

export function CheckoutPage() {
  const { profile } = useAuth();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const navigate = useNavigate();

  const paymentMethod = "eft" as const;
  const [couponCode, setCouponCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const list = map.get(item.sellerId) ?? [];
      list.push(item);
      map.set(item.sellerId, list);
    }
    return Array.from(map.values()).map((list): CheckoutGroup => ({
      sellerId: list[0].sellerId,
      sellerName: list[0].sellerName,
      items: list,
      subtotal: list.reduce((a, i) => a + i.price * i.quantity, 0),
    }));
  }, [items]);

  const { data: coupon, error: couponError, isFetching: couponFetching } = useQuery({
    queryKey: ["coupon", appliedCode],
    queryFn: async () => {
      if (!appliedCode) return null;
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", appliedCode)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("That coupon doesn't exist.");
      if (!data.is_active) throw new Error("That coupon is no longer active.");
      if (data.starts_at && new Date(data.starts_at) > new Date()) throw new Error("This coupon isn't active yet.");
      if (data.ends_at && new Date(data.ends_at) < new Date()) throw new Error("This coupon has expired.");
      if (data.usage_limit != null && data.used_count >= data.usage_limit) throw new Error("This coupon has reached its usage limit.");
      return data;
    },
    enabled: Boolean(appliedCode),
    retry: false,
  });

  const discountFor = (group: CheckoutGroup): number => {
    if (!coupon) return 0;
    if (coupon.seller_id && coupon.seller_id !== group.sellerId) return 0;
    if (coupon.min_order_amount > 0 && group.subtotal < coupon.min_order_amount) return 0;
    if (coupon.discount_type === "percentage") {
      return Math.round(group.subtotal * (coupon.discount_value / 100) * 100) / 100;
    }
    return Math.min(coupon.discount_value, group.subtotal);
  };

  const totals = groups.map((group) => {
    const discount = discountFor(group);
    const shipping = group.subtotal - discount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
    return { group, discount, shipping, total: group.subtotal - discount + shipping };
  });

  const grandTotal = totals.reduce((a, t) => a + t.total, 0);
  const grandDiscount = totals.reduce((a, t) => a + t.discount, 0);

  const placeOrder = async (values: AddressValues) => {
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setSubmitting(true);
    const address = {
      recipient: values.recipient,
      phone: values.phone,
      line1: values.line1,
      line2: values.line2 || "",
      city: values.city,
      province: values.province,
      postal_code: values.postal_code,
    } as unknown as Json;

    const placed: string[] = [];
    try {
      for (const group of groups) {
        const { data, error } = await supabase.rpc("place_order", {
          p_seller_id: group.sellerId,
          p_items: group.items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            size: i.size ?? null,
            colour: i.colour ?? null,
          })) as unknown as Json,
          p_payment_method: paymentMethod,
          p_shipping_address: address,
          ...(notes.trim() ? { p_notes: notes.trim() } : {}),
          ...(appliedCode ? { p_coupon_code: appliedCode } : {}),
        });
        if (error) throw new Error(error.message);
        if (data?.order_number) placed.push(data.order_number);
      }
      clearCart();
      const ids = totals.map((t) => t.group.sellerId);
      navigate("/order/success", {
        state: { orderNumbers: placed, sellerIds: ids, paymentMethod, grandTotal },
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "There was a problem placing your order.");
      if (placed.length > 0) {
        toast.info(`Some orders were placed (${placed.join(", ")}). Check your orders page.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
        <div className="mt-6 border border-dashed border-neutral-300 p-12 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 font-medium text-neutral-700">Your bag is empty</p>
          <Link to="/shop" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
            Go shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-1440 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Checkout</h1>

      <form onSubmit={handleSubmit(placeOrder)} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
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
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          {/* Payment */}
          <section className="border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Payment method</h2>
            <div className="mt-4">
              <div className="flex items-start gap-3 border border-brand-500 bg-brand-50 p-4">
                <CreditCard className="mt-0.5 h-5 w-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">EFT / bank transfer</p>
                  <p className="text-xs text-neutral-500">We'll confirm once your payment reflects</p>
                </div>
              </div>
              <p className="mt-3 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Bank details will be shown on your order confirmation. Please use your order number as the payment reference.
              </p>
            </div>
          </section>

          {/* Notes */}
          <section className="border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Order notes</h2>
            <Textarea
              className="mt-3"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: delivery instructions, gift notes…"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-32">
          {totals.map(({ group, discount, shipping, total }) => (
            <div key={group.sellerId} className="border border-neutral-200 p-5">
              <p className="text-sm font-semibold text-neutral-900">{group.sellerName}</p>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div key={`${item.productId}|${item.size ?? ""}|${item.colour ?? ""}`} className="flex items-center gap-3">
                    <div className="h-12 w-10 shrink-0 overflow-hidden bg-neutral-100">
                      {productImageUrl(item.image) ? (
                        <img src={productImageUrl(item.image)!} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-neutral-800">{item.name}</p>
                      <p className="text-xs text-neutral-400">
                        {[item.size, item.colour].filter(Boolean).join(" · ") || "One size"} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-neutral-900">{formatZAR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-neutral-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Subtotal</dt>
                  <dd className="text-neutral-900">{formatZAR(group.subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd>-{formatZAR(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Shipping</dt>
                  <dd className="text-neutral-900">{shipping === 0 ? "Free" : formatZAR(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                  <dt className="text-neutral-900">Total</dt>
                  <dd className="text-neutral-900">{formatZAR(total)}</dd>
                </div>
              </dl>
            </div>
          ))}

          {/* Coupon */}
          <div className="border border-neutral-200 p-5">
            <p className="text-sm font-semibold text-neutral-900">Coupon</p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="e.g. WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!couponCode.trim() || couponFetching}
                onClick={() => setAppliedCode(couponCode.trim())}
              >
                {couponFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
            {couponError && <p className="mt-2 text-xs text-red-600">{(couponError as Error).message}</p>}
            {coupon && (
              <p className="mt-2 text-xs text-green-600">
                {coupon.code} applied — {coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : formatZAR(coupon.discount_value) + " off"}
              </p>
            )}
          </div>

          <div className="bg-neutral-900 p-5 text-white">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Subtotal</span>
              <span>{formatZAR(groups.reduce((a, g) => a + g.subtotal, 0))}</span>
            </div>
            {grandDiscount > 0 && (
              <div className="mt-1 flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-{formatZAR(grandDiscount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-neutral-300">Shipping</span>
              <span>{formatZAR(totals.reduce((a, t) => a + t.shipping, 0))}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatZAR(grandTotal)}</span>
            </div>
            <Button type="submit" variant="accent" size="lg" className="mt-4 w-full" loading={submitting}>
              Place order · {formatZAR(grandTotal)}
            </Button>
            <p className="mt-2 text-center text-xs text-neutral-400">
              By placing your order you agree to our terms &amp; conditions.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
