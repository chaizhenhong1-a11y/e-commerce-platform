-- Phase 054.31.27: structured storefront product merchandising data
ALTER TABLE "Product"
ADD COLUMN "details" JSONB,
ADD COLUMN "colorSwatches" JSONB;
