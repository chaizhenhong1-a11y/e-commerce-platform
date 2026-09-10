ALTER TABLE "StoreSettings" ALTER COLUMN "storeName" SET DEFAULT 'Elvane';
UPDATE "StoreSettings"
SET "storeName" = regexp_replace("storeName", 'textshop', 'Elvane', 'gi'), "updatedAt" = NOW()
WHERE "storeName" ~* 'textshop';

DO $$
DECLARE field RECORD;
BEGIN
  FOR field IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND (
      (table_name = 'StoreSettings' AND column_name IN (
        'storeTagline', 'storeDescription', 'deliveryPolicy', 'returnsPolicy',
        'faqContent', 'trustSafetyContent', 'termsContent', 'privacyContent',
        'estimatedDelivery', 'returnCondition', 'refundMethod'))
      OR (table_name = 'StoreLocation' AND column_name IN ('name', 'description'))
    )
  LOOP
    EXECUTE format(
      'UPDATE %I SET %I = regexp_replace(%I, ''textshop'', ''Elvane'', ''gi''), "updatedAt" = NOW() WHERE %I ~* ''textshop''',
      field.table_name, field.column_name, field.column_name, field.column_name);
  END LOOP;
END $$;
