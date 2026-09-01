-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED' BEFORE 'REFUNDED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN "staffNote" TEXT;

-- AlterTable
ALTER TABLE "ReturnItem" ADD COLUMN "inspectedAt" TIMESTAMP(3),
ADD COLUMN "restockedAt" TIMESTAMP(3);
