import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil, Star, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function AddressBook() {
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
    <div className="mt-10 border-t border-neutral-200 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Saved addresses</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Delivery addresses for a faster checkout. Your orders keep the address you used even if this changes.
          </p>
        </div>
        {!formOpen && (
          <Button type="button" variant="outline" onClick={startAdd}>
            Add address
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-3">
          <div className="h-28 animate-pulse border border-neutral-200 bg-neutral-50" />
        </div>
      ) : (addresses ?? []).length === 0 && !formOpen ? (
        <div className="mt-6 border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No saved addresses yet. Add one below or save it at checkout.
        </div>
      ) : null}

      {(addresses ?? []).length > 0 && (
        <div className="mt-6 grid gap-3">
          {addresses?.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-start justify-between gap-4 border p-4",
                a.is_default ? "border-brand-500 bg-brand-50" : "border-neutral-200 bg-white"
              )}
            >
              <div className="text-sm text-neutral-600">
                <p className="font-semibold text-neutral-900">
                  {a.recipient}
                  {a.is_default && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                </p>
                <p className="mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                <p>{a.city}, {a.province} {a.postal_code}</p>
                <p>{a.phone}</p>
              </div>
              {!formOpen && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {!a.is_default && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onSetDefault(a)}>
                      Set default
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(a)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <MapPin className="h-4 w-4 text-brand-600" />
            <h3 className="font-medium text-neutral-900">{editing === "new" ? "New address" : "Edit address"}</h3>
          </div>

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
            <Field label="City / town" error={errors.city?.message}>
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

          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
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
  );
}