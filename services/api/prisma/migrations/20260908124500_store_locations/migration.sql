CREATE TABLE IF NOT EXISTS "StoreLocation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL DEFAULT '',
  "addressLine2" TEXT NOT NULL DEFAULT '',
  "city" TEXT NOT NULL DEFAULT '',
  "state" TEXT NOT NULL DEFAULT '',
  "postcode" TEXT NOT NULL DEFAULT '',
  "countryCode" TEXT NOT NULL DEFAULT 'MY',
  "phone" TEXT NOT NULL DEFAULT '',
  "businessHours" TEXT NOT NULL DEFAULT '',
  "coverUrl" TEXT NOT NULL DEFAULT '',
  "galleryUrls" TEXT NOT NULL DEFAULT '[]',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StoreLocation_active_sort_idx" ON "StoreLocation" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "StoreLocation_primary_idx" ON "StoreLocation" ("isPrimary");

INSERT INTO "StoreLocation" (
  "id", "name", "addressLine1", "addressLine2", "city", "state", "postcode", "countryCode",
  "phone", "businessHours", "coverUrl", "galleryUrls", "isPrimary", "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  'primary-location',
  CASE WHEN COALESCE(NULLIF(TRIM("storeName"), ''), '') = '' THEN 'Main branch' ELSE "storeName" || ' - Main branch' END,
  "addressLine1", "addressLine2", "city", "state", "postcode", "countryCode",
  "contactPhone", "businessHours", "storeCoverUrl", "storeGalleryUrls", true, true, 0, NOW(), NOW()
FROM "StoreSettings"
WHERE "id" = 'primary'
  AND (TRIM("addressLine1") <> '' OR TRIM("city") <> '' OR TRIM("storeCoverUrl") <> '' OR "storeGalleryUrls" <> '[]')
ON CONFLICT ("id") DO NOTHING;
