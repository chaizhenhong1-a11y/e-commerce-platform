CREATE TABLE "StoreSettings" (
  "id" TEXT NOT NULL,
  "storeName" TEXT NOT NULL DEFAULT 'TextShop',
  "logoUrl" TEXT NOT NULL DEFAULT '',
  "contactEmail" TEXT NOT NULL DEFAULT 'support@example.com',
  "contactPhone" TEXT NOT NULL DEFAULT '',
  "addressLine1" TEXT NOT NULL DEFAULT '',
  "addressLine2" TEXT NOT NULL DEFAULT '',
  "city" TEXT NOT NULL DEFAULT '',
  "state" TEXT NOT NULL DEFAULT '',
  "postcode" TEXT NOT NULL DEFAULT '',
  "countryCode" TEXT NOT NULL DEFAULT 'MY',
  "currency" TEXT NOT NULL DEFAULT 'MYR',
  "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  "standardShippingCents" INTEGER NOT NULL DEFAULT 0,
  "freeShippingThresholdCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StoreSettings" (
  "id", "storeName", "contactEmail", "countryCode", "currency", "timeZone"
) VALUES (
  'primary', 'TextShop', 'support@example.com', 'MY', 'MYR', 'Asia/Kuala_Lumpur'
)
ON CONFLICT ("id") DO NOTHING;
