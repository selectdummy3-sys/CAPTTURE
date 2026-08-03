import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useIncrementView, useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductInfo } from "@/components/storefront/ProductInfo";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug ?? "");
  const related = useRelatedProducts(product?.category_id, product?.id, 4);
  const incrementView = useIncrementView();

  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (product?.id) void incrementView.mutateAsync(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    setSize(null);
    setColour(null);
    setQty(1);
    setActiveImage(0);
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-1440 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
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
        <Link to="/shop" className={buttonClass("primary", "md", "mt-6")}>
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mx-auto max-w-1440 px-4 pt-6 sm:px-6">
        <nav className="text-sm text-neutral-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-neutral-800">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/shop" className="hover:text-neutral-800">Shop</Link></li>
            {product.category && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link to={`/shop?category=${product.category.slug}`} className="hover:text-neutral-800">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden>/</li>
            <li className="max-w-[220px] truncate text-neutral-800">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="mx-auto grid max-w-1440 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <ProductGallery product={product} activeImage={activeImage} onSelect={setActiveImage} />
        <ProductInfo
          product={product}
          size={size}
          onSize={setSize}
          colour={colour}
          onColour={setColour}
          qty={qty}
          onQty={setQty}
        />
      </div>

      {product.description && (
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <div className="max-w-3xl rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900">Details</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {related.data && related.data.length > 0 && (
        <section className="mx-auto max-w-1440 px-4 pt-16 sm:px-6">
          <SectionHeading title="You may also like" />
          <div className="mt-6">
            <ProductGrid products={related.data} loading={related.isLoading} skeletons={4} />
          </div>
        </section>
      )}
    </div>
  );
}
