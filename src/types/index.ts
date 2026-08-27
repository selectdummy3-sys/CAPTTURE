import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type Seller = Tables<"sellers">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type Review = Tables<"product_reviews">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Coupon = Tables<"coupons">;
export type Notification = Tables<"notifications">;
export type Commission = Tables<"commissions">;
export type CartItemRow = Tables<"cart_items">;
export type WishlistItem = Tables<"wishlist_items">;
export type StoreFollower = Tables<"store_followers">;
export type RecentlyViewed = Tables<"recently_viewed">;
export type Message = Tables<"messages">;
export type WithdrawalRequest = Tables<"withdrawal_requests">;
export type SupplyCategory = Tables<"supply_categories">;
export type SupplyCourier = Tables<"supply_couriers">;
export type SupplyProduct = Tables<"supply_products">;
export type SupplyOrder = Tables<"supply_orders">;
export type SupplyOrderItem = Tables<"supply_order_items">;
export type PepStore = Tables<"pep_stores">;

/** Seller info embedded on products / orders via a join. */
export type SellerSummary = Pick<
  Seller,
  "id" | "business_name" | "store_username" | "logo_url" | "province" | "application_status"
>;

/** A product enriched with its relations and aggregate stats. */
export type ProductWithDetails = Product & {
  seller?: SellerSummary | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  images?: ProductImage[];
};

export type OrderWithRelations = Order & {
  seller?: SellerSummary | null;
  items?: OrderItem[];
  coupon?: Pick<Coupon, "code" | "discount_type" | "discount_value"> | null;
  user?: Pick<Profile, "id" | "full_name" | "avatar_url" | "email" | "phone"> | null;
  pep_store?: PepStore | null;
};

export type CartLine = {
  productId: string;
  quantity: number;
  size: string | null;
  colour: string | null;
  price: number;
};

export type CartGroup = {
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  sellerLogo: string | null;
  lines: Array<
    CartLine & {
      id: string;
      name: string;
      image: string | null;
      stock: number;
      slug: string;
    }
  >;
};

export interface Address {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
}

export type ProductStatus = "draft" | "pending" | "published" | "rejected" | "archived";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type SupplyProductType = "physical" | "digital" | "service";
export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type SupplyPaymentMethod = "online" | "eft";
export type SupplyPaymentStatus = "unpaid" | "pending_confirmation" | "paid";

export type SupplyAddress = {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code: string;
};

export type SupplyProductWithCategory = SupplyProduct & {
  category?: Pick<SupplyCategory, "id" | "name" | "slug"> | null;
};

export type SupplyOrderWithRelations = SupplyOrder & {
  seller?: Pick<Seller, "id" | "business_name" | "store_username" | "logo_url"> | null;
  items?: SupplyOrderItem[];
};

export type SupplyStats = {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  revenue30d: number;
  productsCount: number;
  activeProducts: number;
  lowStockCount: number;
  categoriesCount: number;
};

export type SupplyCartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  stock: number | null;
  type: SupplyProductType;
  quantity: number;
};
