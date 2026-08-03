import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image: string | null;
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  stock: number;
  size: string | null;
  colour: string | null;
  quantity: number;
}

export function cartKey(item: Pick<CartItem, "productId" | "size" | "colour">): string {
  return `${item.productId}|${item.size ?? ""}|${item.colour ?? ""}`;
}

interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = cartKey(item);
          const existing = state.items.find((i) => cartKey(i) === key);
          const qty = item.quantity ?? 1;
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i) === key
                  ? { ...i, quantity: Math.min(i.stock, i.quantity + qty) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(item.stock, qty) }],
          };
        }),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            cartKey(i) === key
              ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) }
              : i
          ),
        })),
      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => cartKey(i) !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cappture-cart",
      version: 1,
    }
  )
);

export const useCartCount = (): number =>
  useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

export const useCartSubtotal = (): number =>
  useCartStore((s) => s.items.reduce((acc, i) => acc + i.price * i.quantity, 0));
