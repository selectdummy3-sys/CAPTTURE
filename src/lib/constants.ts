export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export const GENDERS = ["men", "women", "unisex", "kids"] as const;

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;

export const APPLICATION_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const PAYMENT_METHODS = ["cod", "eft"] as const;

export const PAYMENT_STATUSES = ["unpaid", "pending_confirmation", "paid"] as const;

export const STORAGE_BUCKETS = {
  storeAssets: "store-assets",
  productImages: "product-images",
  documents: "documents",
} as const;

export const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "UK7", "UK8", "UK9", "UK10", "UK11", "One Size"];

export const COMMON_COLOURS = [
  "Black",
  "White",
  "Sand",
  "Grey",
  "Charcoal",
  "Indigo",
  "Olive",
  "Terracotta",
  "Sage",
  "Bone",
  "Cloud",
  "Cape",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  eft: "Bank transfer (EFT)",
};

export const GENDER_LABELS: Record<string, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
  kids: "Kids",
};
