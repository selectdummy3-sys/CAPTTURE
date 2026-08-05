import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { useIsFollowing, useStore, useStoreFollowersCount, useToggleFollow } from "@/hooks/useStores";
import { useStoreProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Button, buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export function StorePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: store, isLoading } = useStore(username);
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  const { data: followers } = useStoreFollowersCount(store?.id);
  const { data: following = false } = useIsFollowing(store?.id);
  const toggleFollow = useToggleFollow(store?.id);

  useEffect(() => {
    if (!store || store.user_id === user?.id) return;
    void supabase
      .rpc("track_store_visit", { p_seller_id: store.id })
      .then(({ error }) => {
        if (error) console.error("Failed to track store visit", error);
      });
  }, [store, user?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-10 sm:px-6">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="mt-6 h-6 w-64" />
        <Skeleton className="mt-8 h-72 w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">Store not found</h1>
        <p className="mt-2 text-neutral-500">This store isn't available right now.</p>
        <Link to="/stores" className={buttonClass("primary", "md", "mt-6")}>
          Browse stores
        </Link>
      </div>
    );
  }

  const banner = store.banner_url
    ? (store.banner_url.startsWith("http")
        ? store.banner_url
        : supabase.storage.from("store-assets").getPublicUrl(store.banner_url).data.publicUrl)
    : null;
  const logo = store.logo_url
    ? (store.logo_url.startsWith("http")
        ? store.logo_url
        : supabase.storage.from("store-assets").getPublicUrl(store.logo_url).data.publicUrl)
    : null;

  const onFollow = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/store/${store.store_username}`)}`);
      return;
    }
    toggleFollow.mutate(following, {
      onSuccess: () => toast.success(following ? "Unfollowed store" : "Following store"),
    });
  };

  return (
    <div className="pb-20">
      <div className="relative h-40 bg-neutral-200 sm:h-52">
        {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mx-auto max-w-1440 px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <div className="relative z-10 flex h-16 w-16 items-center justify-center overflow-hidden border-4 border-white bg-white shadow-lg sm:h-20 sm:w-20">
              {logo ? (
                <img src={logo} alt={store.business_name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-neutral-500">{store.business_name.slice(0, 1)}</span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">{store.business_name}</h1>
              <p className="text-sm text-neutral-500">@{store.store_username}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {store.province}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {followers ?? 0} followers</span>
              </div>
            </div>
          </div>
          <Button variant={following ? "outline" : "primary"} onClick={onFollow}>
            {following ? "Following" : "Follow store"}
          </Button>
        </div>

        {store.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-neutral-600">{store.description}</p>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900">Products</h2>
          <div className="mt-5">
            <ProductGrid
              products={products}
              loading={productsLoading}
              skeletons={8}
              emptyTitle="No products yet"
              emptyDescription="This store hasn't listed any products yet. Check back soon."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
