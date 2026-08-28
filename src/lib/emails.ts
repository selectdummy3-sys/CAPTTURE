/**
 * CAPTTURE's official public business email addresses.
 *
 * These are the ONLY business addresses that may be shown in customer-facing UI.
 * The internal admin address lives server-side only and is never referenced in
 * the frontend codebase.
 */

export const SUPPORT_EMAIL = "support@captture.co.za";
export const ORDERS_EMAIL = "orders@captture.co.za";
export const SELLER_SUPPORT_EMAIL = "seller.support@captture.co.za";
export const PARTNERSHIPS_EMAIL = "partnerships@captture.co.za";

export interface ContactEmail {
  label: string;
  address: string;
  description: string;
}

export const CONTACT_EMAILS: ContactEmail[] = [
  {
    label: "General Support",
    address: SUPPORT_EMAIL,
    description: "General customer support and platform assistance",
  },
  {
    label: "Orders",
    address: ORDERS_EMAIL,
    description: "Orders and order-related communication",
  },
  {
    label: "Seller Support",
    address: SELLER_SUPPORT_EMAIL,
    description: "Seller support, onboarding and seller technical issues",
  },
  {
    label: "Partnerships",
    address: PARTNERSHIPS_EMAIL,
    description: "Business partnerships, collaborations and brand enquiries",
  },
];

export function mailtoHref(address: string, subject?: string): string {
  return subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`;
}