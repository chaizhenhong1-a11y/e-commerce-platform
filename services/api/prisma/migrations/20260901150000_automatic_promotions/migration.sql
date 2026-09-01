ALTER TABLE "Order" ADD COLUMN "automaticPromotionName" TEXT;

CREATE TABLE "AutomaticPromotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "CouponDiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minSubtotalCents" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountCents" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomaticPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomaticPromotionProduct" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "AutomaticPromotionProduct_pkey" PRIMARY KEY ("promotionId","productId")
);

CREATE TABLE "AutomaticPromotionCategory" (
    "promotionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "AutomaticPromotionCategory_pkey" PRIMARY KEY ("promotionId","categoryId")
);

CREATE INDEX "AutomaticPromotion_isActive_startsAt_endsAt_priority_idx" ON "AutomaticPromotion"("isActive", "startsAt", "endsAt", "priority");
CREATE INDEX "AutomaticPromotionProduct_productId_idx" ON "AutomaticPromotionProduct"("productId");
CREATE INDEX "AutomaticPromotionCategory_categoryId_idx" ON "AutomaticPromotionCategory"("categoryId");
ALTER TABLE "AutomaticPromotionProduct" ADD CONSTRAINT "AutomaticPromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "AutomaticPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomaticPromotionProduct" ADD CONSTRAINT "AutomaticPromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomaticPromotionCategory" ADD CONSTRAINT "AutomaticPromotionCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "AutomaticPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomaticPromotionCategory" ADD CONSTRAINT "AutomaticPromotionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
