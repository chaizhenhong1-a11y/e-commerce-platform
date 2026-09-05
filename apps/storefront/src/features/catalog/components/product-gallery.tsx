"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductImage } from "../domain/product";
import { useProductSelection } from "./product-selection-provider";

type ProductGalleryProps = { images: ProductImage[]; category: string; productName: string };

export function ProductGallery({ images, category, productName }: ProductGalleryProps) {
  const { selectedVariant } = useProductSelection();
  const visibleImages = useMemo(() => {
    const variantImages = selectedVariant ? images.filter((image) => image.variantId === selectedVariant.id) : [];
    const sharedImages = images.filter((image) => !image.variantId);
    if (variantImages.length > 0) return [...variantImages, ...sharedImages];
    return sharedImages.length > 0 ? sharedImages : images;
  }, [images, selectedVariant]);
  const preferredImage = visibleImages.find((image) => image.isPrimary) ?? visibleImages[0] ?? null;
  const [selectedImageId, setSelectedImageId] = useState(preferredImage?.id ?? "");
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!visibleImages.some((image) => image.id === selectedImageId)) setSelectedImageId(preferredImage?.id ?? "");
  }, [preferredImage?.id, selectedImageId, visibleImages]);

  const selectedImage = visibleImages.find((image) => image.id === selectedImageId) ?? preferredImage;
  const selectedIndex = selectedImage ? visibleImages.findIndex((image) => image.id === selectedImage.id) : -1;
  const move = (direction: number) => {
    if (visibleImages.length < 2 || selectedIndex < 0) return;
    const next = (selectedIndex + direction + visibleImages.length) % visibleImages.length;
    setSelectedImageId(visibleImages[next].id);
  };

  useEffect(() => {
    if (!viewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [viewerOpen, selectedIndex, visibleImages.length]);

  return <div className="product-gallery">
    <div className="product-gallery__main">
      <span className="product-gallery__tag">Featured</span>
      {selectedImage ? <button className="product-gallery__zoom-trigger" type="button" onClick={() => setViewerOpen(true)} aria-label={`Enlarge ${selectedImage.altText}`}>
        <img className="product-gallery__main-image" src={selectedImage.url} alt={selectedImage.altText} />
        <span className="product-gallery__zoom-hint" aria-hidden="true">＋ Enlarge</span>
      </button> : <div className="product-gallery__placeholder" aria-hidden="true"><span>{category.slice(0, 1)}</span></div>}
    </div>
    <div className="product-gallery__thumbs" aria-label={`${productName} images`}>
      {visibleImages.length > 0 ? visibleImages.map((image) => { const selected=image.id===selectedImage?.id; return <button className={["product-gallery__thumb",selected?"product-gallery__thumb--selected":""].filter(Boolean).join(" ")} type="button" aria-label={`View ${image.altText}`} aria-pressed={selected} key={image.id} onClick={()=>setSelectedImageId(image.id)}><img src={image.url} alt="" /></button>; }) : [1,2,3].map((item)=><div key={item} aria-hidden="true">0{item}</div>)}
    </div>
    {viewerOpen && selectedImage ? <div className="product-lightbox" role="dialog" aria-modal="true" aria-label={`${productName} image viewer`} onMouseDown={(event)=>{if(event.target===event.currentTarget)setViewerOpen(false);}}>
      <button className="product-lightbox__close" type="button" onClick={()=>setViewerOpen(false)} aria-label="Close image viewer">×</button>
      {visibleImages.length>1 ? <button className="product-lightbox__nav product-lightbox__nav--prev" type="button" onClick={()=>move(-1)} aria-label="Previous image">‹</button> : null}
      <div className="product-lightbox__stage"><img src={selectedImage.url} alt={selectedImage.altText}/><span>{selectedIndex+1} / {visibleImages.length}</span></div>
      {visibleImages.length>1 ? <button className="product-lightbox__nav product-lightbox__nav--next" type="button" onClick={()=>move(1)} aria-label="Next image">›</button> : null}
    </div> : null}
  </div>;
}
