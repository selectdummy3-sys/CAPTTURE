import { Megaphone } from "lucide-react";

export function SellerPromotions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Promotions</h1>
        <p className="text-sm text-neutral-500">Run flash sales, bundle deals and coupons.</p>
      </div>

      <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
        <div className="grid h-14 w-14 place-items-center bg-brand-50">
          <Megaphone className="h-7 w-7 text-brand-500" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-neutral-900">Coming soon</h2>
        <p className="mt-1 max-w-md text-sm text-neutral-500">
          We're building promotional tools to help you grow sales — flash sales, bundle deals, discount
          coupons and sponsored placements. Stay tuned.
        </p>
      </div>
    </div>
  );
}