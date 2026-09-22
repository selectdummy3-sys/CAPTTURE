import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROVINCES } from "@/lib/constants";
import {
  addressSchema,
  addressPayloadFromRow,
  toAddressPayload,
  type AddressValues,
  type SavedAddress,
} from "@/lib/address";
import {
  useDeleteAddressMutation,
  useSaveAddressMutation,
  useSavedAddresses,
  useSetDefaultAddress,
  useUpdateAddressMutation,
} from "@/hooks/useAddresses";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { isNative } from "@/lib/capacitor";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border border-transparent bg-neutral-100 px-3.5 text-[15px] text-neutral-900 shadow-none placeholder:text-neutral-400 focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500";

export function AddressBookPage() {
  const { data: addresses, isLoading } = useSavedAddresses();
  const save = useSaveAddressMutation();
  const update = useUpdateAddressMutation();
  const del = useDeleteAddressMutation();
  const setDefault = useSetDefaultAddress();

  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const formOpen = editing != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { line2: "" },
  });

  const startAdd = () => {
    reset({ recipient: "", phone: "", line1: "", line2: "", city: "", province: "", postal_code: "" });
    setEditing("new");
  };

  const startEdit = (a: SavedAddress) => {
    reset(addressPayloadFromRow(a));
    setEditing(a);
  };

  const cancel = () => setEditing(null);

  const onSubmit = async (values: AddressValues) => {
    const payload = toAddressPayload(values);
    try {
      if (editing === "new") {
        await save.mutateAsync(payload);
        toast.success("Address saved.");
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Address updated.");
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the address.");
    }
  };

  const onDelete = async (a: SavedAddress) => {
    try {
      await del.mutateAsync(a.id);
      toast.success("Address removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the address.");
    }
  };

  const onSetDefault = async (a: SavedAddress) => {
    try {
      await setDefault.mutateAsync(a.id);
      toast.success("Default address updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the default address.");
    }
  };

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Address book" backTo="/account" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">
        <p className="text-sm leading-relaxed text-neutral-500">
          Saved delivery addresses for a faster checkout. Your orders keep the address you used, even
          if this changes.
        </p>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-24 animate-pulse rounded-2xl border border-neutral-200/70 bg-white shadow-sm" />
            <div className="h-24 animate-pulse rounded-2xl border border-neutral-200/70 bg-white shadow-sm" />
          </div>
        ) : (addresses ?? []).length === 0 && !formOpen ? (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-transparent p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-neutral-400 shadow-sm">
              <MapPin className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-neutral-900">No saved addresses yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add one below, or save an address when you check out.
            </p>
            <Button type="button" onClick={startAdd} className="mt-5 rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add address
            </Button>
          </div>
        ) : null}

        {(addresses ?? []).length > 0 && (
          <div className="mt-4 space-y-3">
            {addresses?.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-sm transition-colors",
                  a.is_default ? "border-royal-200 bg-royal-50/40" : "border-neutral-200/70"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 text-sm text-neutral-600">
                    <p className="font-bold text-neutral-900">
                      {a.recipient}
                      {a.is_default && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-royal-600 px-2 py-0.5 text-[11px] font-medium text-white">
                          <Star className="h-3 w-3" /> Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                    <p>{a.city}, {a.province} {a.postal_code}</p>
                    <p>{a.phone}</p>
                  </div>
                  {!formOpen && (
                    <div className="flex shrink-0 items-center gap-1">
                      {!a.is_default && (
                        <button
                          type="button"
                          onClick={() => onSetDefault(a)}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-royal-700 transition-colors hover:bg-royal-50"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        aria-label="Edit address"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(a)}
                        aria-label="Delete address"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-neutral-200 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!formOpen && (addresses ?? []).length > 0 && (
          <Button type="button" variant="outline" onClick={startAdd} className="mt-4 w-full rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add another address
          </Button>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <MapPin className="h-4 w-4 text-royal-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                {editing === "new" ? "New address" : "Edit address"}
              </h3>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient full name" error={errors.recipient?.message}>
                <Input placeholder="Nomsa Dlamini" className={inputClass} {...register("recipient")} />
              </Field>
              <Field label="Phone number" error={errors.phone?.message}>
                <Input type="tel" placeholder="082 123 4567" className={inputClass} {...register("phone")} />
              </Field>
              <Field label="Street address" error={errors.line1?.message} className="sm:col-span-2">
                <Input placeholder="14 Kerk Street" className={inputClass} {...register("line1")} />
              </Field>
              <Field label="Address line 2 (optional)">
                <Input placeholder="Unit 5, Sandton" className={inputClass} {...register("line2")} />
              </Field>
              <Field label="Postal code" error={errors.postal_code?.message}>
                <Input placeholder="2196" className={inputClass} {...register("postal_code")} />
              </Field>
              <Field label="City / town" error={errors.city?.message}>
                <Input placeholder="Johannesburg" className={inputClass} {...register("city")} />
              </Field>
              <Field label="Province" error={errors.province?.message}>
                <Select className={inputClass} {...register("province")}>
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing === "new" ? "Save address" : "Save changes"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}