-- Product images may remain product-wide or optionally target one SKU/variant.
ALTER TABLE "ProductImage"
ADD COLUMN "variantId" TEXT;

CREATE INDEX "ProductImage_variantId_sortOrder_idx"
ON "ProductImage"("variantId", "sortOrder");

ALTER TABLE "ProductImage"
ADD CONSTRAINT "ProductImage_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
