import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useIncrementView, useAlsoBought, useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/useCartStore";
import { useGalleryImages } from "@/components/storefront/ProductGallery";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug ?? "");
  const incrementView = useIncrementView();
  const alsoBought = useAlsoBought(product?.id);
  const related = useRelatedProducts(product?.category_id, product?.id, 4);

  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const { user } = useAuth();
  const addToCart = useCartStore((s) => s.add);
  const { data: wishlisted = false } = useIsWishlisted(product?.id ?? "");
  const toggleWishlist = useToggleWishlist(product?.id ?? "");
  const images = useGalleryImages(product);

  useEffect(() => {
    if (product?.id) void incrementView.mutateAsync(product.id);
  }, [product?.id]);

  useEffect(() => {
    setSize(null);
    setColour(null);
    setActiveImage(0);
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-10 sm:px-6">
        <Skeleton className="aspect-square w-full" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-1440 px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-5xl font-medium uppercase tracking-tight text-neutral-900">Product not found</h1>
        <p className="mt-3 text-neutral-500">This product may have been removed or is unavailable.</p>
        <Link to="/shop" className="mt-8 inline-flex h-12 items-center gap-2 bg-brand-500 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-brand-400">
          Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !size) {
      toast.error("Select a size");
      return;
    }
    if (product.colours.length > 0 && !colour) {
      toast.error("Select a colour");
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.sale_price ?? product.price,
      originalPrice: product.price,
      image: product.featured_image,
      sellerId: product.seller_id,
      sellerName: product.seller?.business_name ?? "Independent seller",
      sellerUsername: product.seller?.store_username ?? "",
      stock: product.stock,
      size,
      colour,
      quantity: 1,
    });
    toast.success("Added to your bag");
  };

  const handleWishlist = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${product.slug}`)}`);
      return;
    }
    toggleWishlist.mutate(wishlisted);
  };

  return (
    <div className="mx-auto max-w-1440 px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Image — LEFT */}
        <div className="order-1">
          <div className="w-full overflow-hidden bg-paper-deep">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square w-full place-items-center text-sm text-neutral-400">
                No image yet
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "shrink-0 overflow-hidden border-2 transition-colors",
                    i === activeImage ? "border-brand-500" : "border-transparent"
                  )}
                >
                  <img src={img} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info — RIGHT */}
        <div className="order-2">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
            <span className="h-px w-8 bg-brand-500" />
            {product.category?.name ?? "The rack"}
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-5xl">
            {product.name}
          </h1>
          {product.seller && (
            <Link
              to={`/store/${product.seller.store_username}`}
              className="stitch mt-2 inline-block pb-1 text-sm text-neutral-500 transition-colors hover:text-brand-700"
            >
              by {product.seller.business_name}
            </Link>
          )}

          <div className="mt-4">
            <Price price={product.price} salePrice={product.sale_price} size="lg" />
          </div>

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-7">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-editorial text-neutral-500">
                Select a size
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "border px-4 py-2.5 text-sm font-medium transition-colors",
                      size === s
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-500"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colour */}
          {product.colours.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-editorial text-neutral-500">
                Select a colour
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colours.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColour(c)}
                    className={cn(
                      "border px-4 py-2.5 text-sm font-medium transition-colors",
                      colour === c
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-500"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-7">
            <Button variant="accent" className="w-full" size="lg" disabled={outOfStock} onClick={handleAddToCart}>
              <ShoppingBag className="h-5 w-5" />
              {outOfStock ? "Sold out" : "Add to bag"}
            </Button>
          </div>

          {/* Wishlist */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleWishlist}
              className={cn(
                "flex w-full items-center justify-center gap-2 border py-3 text-sm font-medium transition-colors",
                wishlisted
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-neutral-300 text-neutral-600 hover:border-brand-500"
              )}
            >
              <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
              {wishlisted ? "Saved to wishlist" : "Add to wishlist"}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 border-t border-neutral-200 pt-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            </div>
          )}

          {/* Product details */}
          <div className="mt-6 space-y-3 border-t border-neutral-200 pt-6 text-sm">
            {product.category && (
              <div className="flex gap-4">
                <span className="w-24 text-neutral-500">Category</span>
                <span className="text-neutral-900">{product.category.name}</span>
              </div>
            )}
            {product.material && (
              <div className="flex gap-4">
                <span className="w-24 text-neutral-500">Material</span>
                <span className="text-neutral-900">{product.material}</span>
              </div>
            )}
            {product.colours.length > 0 && (
              <div className="flex gap-4">
                <span className="w-24 text-neutral-500">Colour</span>
                <span className="text-neutral-900">{product.colours.join(", ")}</span>
              </div>
            )}
            {product.seller && (
              <div className="flex gap-4">
                <span className="w-24 text-neutral-500">Brand</span>
                <span className="text-neutral-900">{product.seller.business_name}</span>
              </div>
            )}
          </div>

          {/* Trust strip */}
          <div className="mt-8 border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            <p className="font-semibold uppercase tracking-editorial text-[11px] text-neutral-900">
              Shipping &amp; trust
            </p>
            <p className="mt-2">Flat R60 delivery · free over R1,000. Secure checkout with buyer protection.</p>
          </div>
        </div>
      </div>

      {(alsoBought.isLoading || (alsoBought.data?.length ?? 0) > 0) && (
        <section className="mt-20">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900 sm:text-3xl">
              What others also bought
            </h2>
            <div className="stitch flex-1 h-px bg-neutral-400/70" />
          </div>
          <div className="mt-6">
            <ProductGrid products={alsoBought.data} loading={alsoBought.isLoading} skeletons={4} />
          </div>
        </section>
      )}

      {!alsoBought.isLoading &&
        (alsoBought.data?.length ?? 0) === 0 &&
        (related.isLoading || (related.data?.length ?? 0) > 0) && (
          <section className="mt-20">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900 sm:text-3xl">
                You may also like
              </h2>
              <div className="stitch flex-1 h-px bg-neutral-400/70" />
            </div>
            <div className="mt-6">
              <ProductGrid products={related.data} loading={related.isLoading} skeletons={4} />
            </div>
          </section>
        )}
    </div>
  );
}
