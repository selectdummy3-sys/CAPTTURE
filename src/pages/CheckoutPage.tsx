import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Loader2, Lock, MapPin, PackageCheck, Store, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useLiveSellerNames } from "@/hooks/useStores";
import { usePepStores } from "@/hooks/usePepStores";
import { beginPayFastPayment, getPayFastRedirectData, submitPayFastForm } from "@/hooks/usePayFast";
import { supabase } from "@/lib/supabase";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Field } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/constants";
import { cn, formatZAR } from "@/lib/utils";
import type { PepDeliveryTier } from "@/types";
import type { Json } from "@/types/database";
import { ensureAddressSaved, useSavedAddresses } from "@/hooks/useAddresses";
import { toAddressPayload, type SavedAddress } from "@/lib/address";

const FREE_SHIPPING_ABOVE = 1000;
const SHIPPING_FEE = 60;
const PEP_STANDARD_FEE = 60;
const PEP_EXPRESS_FEE = 100;

type DeliveryMethod = "shipping" | "pep_collect";

const addressSchema = z.object({
  recipient: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
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

  const paymentMethod = "payfast" as const;
  const [couponCode, setCouponCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [placedOrderNumbers, setPlacedOrderNumbers] = useState<string[]>([]);

  useEffect(() => {
    if (placedOrderNumbers.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [placedOrderNumbers]);
  const [delivery, setDelivery] = useState<DeliveryMethod>("shipping");
  const [pepProvince, setPepProvince] = useState("");
  const [pepCity, setPepCity] = useState("");
  const [pepStoreId, setPepStoreId] = useState("");
  const [pepTier, setPepTier] = useState<PepDeliveryTier>("standard");

  const {
    register,
    handleSubmit,
    setValue,
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

  const sellerIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.sellerId).filter(Boolean))),
    [items]
  );
  const { data: sellerMap } = useLiveSellerNames(sellerIds);

  const displayGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        sellerName: sellerMap?.[group.sellerId]?.business_name ?? group.sellerName,
      })),
    [groups, sellerMap]
  );

  const { data: pepStores, isLoading: pepLoading } = usePepStores();
  const { data: savedAddresses } = useSavedAddresses();

  const applySavedAddress = (a: SavedAddress) => {
    setValue("recipient", a.recipient);
    setValue("phone", a.phone);
    setValue("line1", a.line1);
    setValue("line2", a.line2 ?? "");
    setValue("city", a.city);
    setValue("province", a.province);
    setValue("postal_code", a.postal_code);
  };

  const pepCities = useMemo(() => {
    if (!pepProvince) return [];
    const set = new Set<string>();
    for (const s of pepStores ?? []) {
      if (s.province.toUpperCase() !== pepProvince.toUpperCase()) continue;
      if (s.city) set.add(s.city);
    }
    return Array.from(set).sort();
  }, [pepStores, pepProvince]);

  const availablePepStores = useMemo(() => {
    if (!pepProvince) return pepStores ?? [];
    const targetProvince = pepProvince.toUpperCase();
    const targetCity = pepCity ? pepCity.toUpperCase() : "";
    return (pepStores ?? []).filter(
      (s) =>
        s.province.toUpperCase() === targetProvince &&
        (!targetCity || s.city.toUpperCase() === targetCity)
    );
  }, [pepStores, pepProvince, pepCity]);

  const isCollect = delivery === "pep_collect";
  const pepFee = isCollect
    ? pepTier === "express"
      ? PEP_EXPRESS_FEE
      : PEP_STANDARD_FEE
    : 0;

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
    const shipping = isCollect
      ? pepFee
      : group.subtotal - discount >= FREE_SHIPPING_ABOVE
        ? 0
        : SHIPPING_FEE;
    return { group, discount, shipping, total: group.subtotal - discount + shipping };
  });

  const grandTotal = totals.reduce((a, t) => a + t.total, 0);
  const grandDiscount = totals.reduce((a, t) => a + t.discount, 0);
  const grandShipping = totals.reduce((a, t) => a + t.shipping, 0);

  const placeOrder = async (values: AddressValues) => {
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    if (isCollect) {
      if (!pepStoreId) {
        toast.error("Select your preferred PEP store");
        return;
      }
    } else if (!values.line1 || !values.city || !values.province || !values.postal_code) {
      toast.error("Complete your delivery address");
      return;
    }

    setSubmitting(true);
    const address = isCollect
      ? ({
          recipient: values.recipient,
          phone: values.phone,
        } as unknown as Json)
      : (toAddressPayload(values) as unknown as Json);

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
          p_delivery_method: delivery,
          ...(isCollect ? { p_pep_delivery_tier: pepTier } : {}),
          ...(isCollect && pepStoreId ? { p_pep_store_id: pepStoreId } : {}),
        });
        if (error) throw new Error(error.message);
        if (data?.order_number) placed.push(data.order_number);
      }
      setPlacedOrderNumbers(placed);
      clearCart();

      if (!isCollect) {
        await ensureAddressSaved(toAddressPayload(values));
      }

      if (paymentMethod === "payfast" && placed.length > 0) {
        setRedirecting(true);
        try {
          const ref = await beginPayFastPayment(placed);
          const redirect = await getPayFastRedirectData(ref);
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          submitPayFastForm(redirect);
          return;
        } catch (pfErr) {
          setRedirecting(false);
          toast.error(
            pfErr instanceof Error ? pfErr.message : "There was a problem starting the PayFast payment."
          );
          toast.info(`Your orders were placed (${placed.join(", ")}). You can pay for them again from your orders page.`);
          return;
        }
      }

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
    if (placedOrderNumbers.length > 0) {
      return (
        <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
            <span className="h-px w-8 bg-brand-500" />
            Order placed
          </p>
          <h1 className="mt-4 font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
            {redirecting ? "Taking you to PayFast…" : "Order received"}
          </h1>
          <div className="mt-6 border border-neutral-200 bg-white p-12 text-center shadow-sm">
            {redirecting ? (
              <>
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" />
                <p className="mt-3 font-medium text-neutral-700">Confirming your order…</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Order{placedOrderNumbers.length > 1 ? "s" : ""} {" "}
                  <span className="font-semibold text-neutral-900">{placedOrderNumbers.join(", ")}</span>{" "}
                  placed. You'll be redirected to PayFast to pay securely — don't close this window.
                </p>
              </>
            ) : (
              <>
                <PackageCheck className="mx-auto h-10 w-10 text-brand-600" />
                <p className="mt-3 font-medium text-neutral-700">Your order is confirmed</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Order number{placedOrderNumbers.length > 1 ? "s" : ""}{" "}
                  {placedOrderNumbers.join(", ")}. Check your orders page for details.
                </p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6">
        <h1 className="font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
          Checkout
        </h1>
        <div className="mt-6 border border-dashed border-neutral-300 p-12 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 font-medium text-neutral-700">Your bag is empty</p>
          <Link to="/shop" className="mt-3 inline-block text-sm font-semibold uppercase tracking-editorial text-brand-700 hover:underline">
            Go shopping
          </Link>
        </div>
      </div>
    );
  }

  const selectedStore = (pepStores ?? []).find((s) => s.id === pepStoreId);

  return (
    <div className="mx-auto max-w-1440 px-4 py-12 sm:px-6 lg:py-16">
      <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
        <span className="h-px w-8 bg-brand-500" />
        Almost there
      </p>
      <h1 className="mt-4 font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
        Checkout
      </h1>

      <form onSubmit={handleSubmit(placeOrder)} className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Delivery method */}
          <section className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900">Delivery method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDelivery("shipping")}
                className={cn(
                  "flex items-start gap-3 border p-4 text-left transition-colors",
                  delivery === "shipping" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <Home className="mt-0.5 h-5 w-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">Home delivery</p>
                  <p className="text-xs text-neutral-500">Courier to your door · {formatZAR(SHIPPING_FEE)}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDelivery("pep_collect")}
                className={cn(
                  "flex items-start gap-3 border p-4 text-left transition-colors",
                  delivery === "pep_collect" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <Store className="mt-0.5 h-5 w-5 text-brand-600" />
                <div>
                  <p className="font-medium text-neutral-900">PEP Click &amp; Collect</p>
                  <p className="text-xs text-neutral-500">Collect at a PEP store · from {formatZAR(PEP_STANDARD_FEE)}</p>
                </div>
              </button>
            </div>

            {isCollect ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Recipient full name" error={errors.recipient?.message}>
                    <Input placeholder="Nomsa Dlamini" {...register("recipient")} />
                  </Field>
                  <Field label="Phone number" error={errors.phone?.message}>
                    <Input type="tel" placeholder="082 123 4567" {...register("phone")} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Province" error={errors.province?.message}>
                    <Select
                      value={pepProvince}
                      onChange={(e) => {
                        setPepProvince(e.target.value);
                        setPepCity("");
                        setPepStoreId("");
                      }}
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="City / town">
                    <Select
                      value={pepCity}
                      disabled={!pepProvince || pepCities.length === 0}
                      onChange={(e) => {
                        setPepCity(e.target.value);
                        setPepStoreId("");
                      }}
                    >
                      <option value="">
                        {!pepProvince ? "Select province first" : "Any city"}
                      </option>
                      {pepCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="PEP store" error={!pepStoreId && delivery === "pep_collect" ? "Select a store" : undefined}>
                    <Select
                      value={pepStoreId}
                      disabled={!pepProvince || pepLoading}
                      onChange={(e) => setPepStoreId(e.target.value)}
                    >
                      <option value="">
                        {pepLoading ? "Loading stores…" : "Select a PEP store"}
                      </option>
                      {availablePepStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.store_name} — {s.city} {s.store_code}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {selectedStore && (
                  <div className="flex items-start gap-3 border border-neutral-200 bg-neutral-50 p-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-neutral-900">{selectedStore.store_name} · {selectedStore.store_code}</p>
                      <p className="mt-0.5 text-neutral-600">{selectedStore.raw_address}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Collect your order at this PEP store once it's ready.
                      </p>
                    </div>
                  </div>
                )}
                {isCollect && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-editorial text-neutral-500">Delivery speed</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setPepTier("standard")}
                        className={cn(
                          "flex items-start gap-3 border p-4 text-left transition-colors",
                          pepTier === "standard" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <Truck className="mt-0.5 h-5 w-5 text-neutral-500" />
                        <div>
                          <p className="font-medium text-neutral-900">Standard · 7–9 days</p>
                          <p className="text-xs text-neutral-500">{formatZAR(PEP_STANDARD_FEE)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPepTier("express")}
                        className={cn(
                          "flex items-start gap-3 border p-4 text-left transition-colors",
                          pepTier === "express" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <Truck className="mt-0.5 h-5 w-5 text-brand-600" />
                        <div>
                          <p className="font-medium text-neutral-900">Express · 3–5 days</p>
                          <p className="text-xs text-neutral-500">{formatZAR(PEP_EXPRESS_FEE)}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-editorial text-neutral-500">From your saved addresses</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applySavedAddress(a)}
                          className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:border-brand-500 hover:bg-brand-50"
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                          <span>{a.recipient} · {a.line1}, {a.city}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900">Payment method</h2>
            <div className="mt-4 flex w-full items-start gap-3 border border-brand-500 bg-brand-50 p-4 text-left">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-medium text-neutral-900">PayFast</p>
                <p className="text-xs text-neutral-500">Card &amp; mobile — paid securely through PayFast</p>
              </div>
            </div>
            <p className="mt-3 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              You'll be redirected to PayFast to pay securely. Your orders are confirmed once payment is received.
            </p>
          </section>

          {/* Notes */}
          <section className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900">Order notes</h2>
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
          {totals.map(({ group, discount, shipping, total }) => {
            const liveSeller = displayGroups.find((g) => g.sellerId === group.sellerId);
            return (
            <div key={group.sellerId} className="border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="font-display text-lg font-medium uppercase tracking-tight text-neutral-900">{liveSeller?.sellerName ?? group.sellerName}</p>
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
                {isCollect ? (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">
                      Collection ({pepTier === "express" ? "3–5 days" : "7–9 days"})
                    </dt>
                    <dd className="text-neutral-900">{formatZAR(shipping)}</dd>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Shipping</dt>
                    <dd className="text-neutral-900">{shipping === 0 ? "Free" : formatZAR(shipping)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                  <dt className="text-neutral-900">Total</dt>
                  <dd className="text-neutral-900">{formatZAR(total)}</dd>
                </div>
              </dl>
            </div>
            );
          })}

          {/* Coupon */}
          <div className="border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="font-display text-lg font-medium uppercase tracking-tight text-neutral-900">Coupon</p>
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
              <span className="text-neutral-300">
                {isCollect ? `Collection (${pepTier === "express" ? "3–5 days" : "7–9 days"})` : "Shipping"}
              </span>
              <span>{formatZAR(grandShipping)}</span>
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

      {redirecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-neutral-950/70 px-6 text-center backdrop-blur-sm">
          <Loader2 className="h-14 w-14 animate-spin text-brand-400" strokeWidth={1.5} />
          <p className="text-lg font-semibold text-white">Redirecting you to a secure payment gateway</p>
          <p className="flex items-center gap-1.5 text-sm text-neutral-300">
            <Lock className="h-3.5 w-3.5" /> Card · Mobile — powered by PayFast
          </p>
          <p className="text-xs text-neutral-400">
            Please don't close or refresh this page while your payment is authorised.
          </p>
        </div>
      )}
    </div>
  );
}
