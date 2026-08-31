"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductImage } from "../domain/product";
import { useProductSelection } from "./product-selection-provider";

type ProductGalleryProps = {
  images: ProductImage[];
  category: string;
  productName: string;
};

export function ProductGallery({
  images,
  category,
  productName,
}: ProductGalleryProps) {
  const { selectedVariant } = useProductSelection();

  const visibleImages = useMemo(() => {
    const variantImages = selectedVariant
      ? images.filter((image) => image.variantId === selectedVariant.id)
      : [];
    const sharedImages = images.filter((image) => !image.variantId);

    if (variantImages.length > 0) {
      return [...variantImages, ...sharedImages];
    }

    return sharedImages.length > 0 ? sharedImages : images;
  }, [images, selectedVariant]);

  const preferredImage =
    visibleImages.find((image) => image.isPrimary) ?? visibleImages[0] ?? null;
  const [selectedImageId, setSelectedImageId] = useState(
    preferredImage?.id ?? "",
  );

  useEffect(() => {
    const stillVisible = visibleImages.some(
      (image) => image.id === selectedImageId,
    );
    if (!stillVisible) {
      setSelectedImageId(preferredImage?.id ?? "");
    }
  }, [preferredImage?.id, selectedImageId, visibleImages]);

  const selectedImage =
    visibleImages.find((image) => image.id === selectedImageId) ??
    preferredImage;

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <span className="product-gallery__tag">Featured</span>
        {selectedImage ? (
          <img
            className="product-gallery__main-image"
            src={selectedImage.url}
            alt={selectedImage.altText}
          />
        ) : (
          <div className="product-gallery__placeholder" aria-hidden="true">
            <span>{category.slice(0, 1)}</span>
          </div>
        )}
      </div>

      <div
        className="product-gallery__thumbs"
        aria-label={`${productName} images`}
      >
        {visibleImages.length > 0
          ? visibleImages.map((image) => {
              const selected = image.id === selectedImage?.id;
              return (
                <button
                  className={[
                    "product-gallery__thumb",
                    selected ? "product-gallery__thumb--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  aria-label={`View ${image.altText}`}
                  aria-pressed={selected}
                  key={image.id}
                  onClick={() => setSelectedImageId(image.id)}
                >
                  <img src={image.url} alt="" />
                </button>
              );
            })
          : [1, 2, 3].map((item) => (
              <div key={item} aria-hidden="true">
                0{item}
              </div>
            ))}
      </div>
    </div>
  );
}
