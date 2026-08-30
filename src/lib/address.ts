import { z } from "zod";

import type { Database } from "@/types/database";

export type SavedAddress = Database["public"]["Tables"]["addresses"]["Row"];

// Mirrors what place_order snapshots into orders.shipping_address and what is
// stored in addresses. Single source of truth for both the address book and
// checkout so the saved address always equals the address used on the order.
export const addressSchema = z.object({
  recipient: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().regex(/^[0-9+ ()-]{7,20}$/, "Enter a valid phone number"),
  line1: z.string().min(1, "Enter the street address"),
  line2: z.string().optional(),
  city: z.string().min(1, "Enter the city / town"),
  province: z.string().min(1, "Select a province"),
  postal_code: z.string().min(1, "Enter the postal code"),
});

export type AddressValues = z.infer<typeof addressSchema>;

export interface AddressPayload {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
}

export function toAddressPayload(values: AddressValues): AddressPayload {
  return {
    recipient: values.recipient.trim(),
    phone: values.phone.trim(),
    line1: values.line1.trim(),
    line2: values.line2?.trim() || undefined,
    city: values.city.trim(),
    province: values.province.trim(),
    postal_code: values.postal_code.trim(),
  };
}

export function addressPayloadFromRow(row: SavedAddress): AddressPayload {
  return {
    recipient: row.recipient,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 ?? undefined,
    city: row.city,
    province: row.province,
    postal_code: row.postal_code,
  };
}

export function sameAddress(a: AddressPayload, b: AddressPayload): boolean {
  return (
    a.recipient === b.recipient &&
    a.phone === b.phone &&
    a.line1 === b.line1 &&
    (a.line2 ?? "") === (b.line2 ?? "") &&
    a.city === b.city &&
    a.province === b.province &&
    a.postal_code === b.postal_code
  );
}