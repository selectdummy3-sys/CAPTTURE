import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SupplyCartItem } from "@/types";

interface SupplyCartStore {
  items: SupplyCartItem[];
  add: (item: SupplyCartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useSupplyCartStore = create<SupplyCartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const max = existing.stock ?? Number.MAX_SAFE_INTEGER;
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(max, i.quantity + item.quantity) }
                  : i
              ),
            };
          }
          const max = item.stock ?? Number.MAX_SAFE_INTEGER;
          return {
            items: [...state.items, { ...item, quantity: Math.min(max, item.quantity) }],
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? {
                  ...i,
                  quantity: Math.max(1, Math.min(i.stock ?? Number.MAX_SAFE_INTEGER, quantity)),
                }
              : i
          ),
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cappture-supply-cart",
      version: 1,
    }
  )
);

export const useSupplyCartCount = (): number =>
  useSupplyCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

export const useSupplyCartSubtotal = (): number =>
  useSupplyCartStore((s) => s.items.reduce((acc, i) => acc + i.price * i.quantity, 0));

export function supplyHasPhysical(items: SupplyCartItem[]): boolean {
  return items.some((i) => i.type === "physical");
}
