import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useIncrementView, useProduct } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";
import { useCartStore } from "@/store/useCartStore";
import { useGalleryImages } from "@/components/storefront/ProductGallery";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug ?? "");
  const incrementView = useIncrementView();

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
        <h1 className="text-2xl font-bold text-neutral-900">Product not found</h1>
        <p className="mt-2 text-neutral-500">This product may have been removed or is unavailable.</p>
        <Link to="/shop" className="mt-6 inline-block border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
          Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    if (product.colours.length > 0 && !colour) {
      toast.error("Please select a colour");
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
    toast.success("Added to bag");
  };

  const handleWishlist = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${product.slug}`)}`);
      return;
    }
    toggleWishlist.mutate(wishlisted);
  };

  return (
    <div className="mx-auto max-w-1440 px-4 py-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Info — LEFT */}
        <div className="order-2 lg:order-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{product.name}</h1>
          {product.seller && (
            <Link
              to={`/store/${product.seller.store_username}`}
              className="mt-1 inline-block text-sm text-neutral-500 hover:text-neutral-800"
            >
              {product.seller.business_name}
            </Link>
          )}

          <div className="mt-3">
            <Price price={product.price} salePrice={product.sale_price} size="lg" />
          </div>

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-neutral-900">Select a size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "border px-4 py-2.5 text-sm font-medium transition-colors",
                      size === s
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
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
              <p className="mb-2 text-sm font-medium text-neutral-900">Select a colour</p>
              <div className="flex flex-wrap gap-2">
                {product.colours.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColour(c)}
                    className={cn(
                      "border px-4 py-2.5 text-sm font-medium transition-colors",
                      colour === c
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-6">
            <Button className="w-full" size="lg" disabled={outOfStock} onClick={handleAddToCart}>
              <ShoppingBag className="h-5 w-5" />
              {outOfStock ? "Sold out" : "Add to cart"}
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
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-900"
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
          <div className="mt-6 border-t border-neutral-200 pt-6 space-y-3 text-sm">
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
        </div>

        {/* Image — RIGHT */}
        <div className="order-1 lg:order-2">
          <div className="w-full bg-neutral-100 lg:sticky lg:top-32">
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
                    "shrink-0 overflow-hidden border-2",
                    i === activeImage ? "border-neutral-900" : "border-transparent"
                  )}
                >
                  <img src={img} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
