import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreSettingsService } from '../settings/store-settings.service';

type SalesAggregate = {
  todayOrders: bigint;
  todayGrossSalesCents: bigint;
  monthOrders: bigint;
  monthGrossSalesCents: bigint;
};

type RefundAggregate = {
  todayRefundsCents: bigint;
  monthRefundsCents: bigint;
};

@Injectable()
export class StaffCommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeSettings: StoreSettingsService,
  ) {}

  async getSummary() {
    const settings = await this.storeSettings.get();
    const timeZone = settings.timeZone || 'Asia/Kuala_Lumpur';

    const [
      totalOrders,
      awaitingPayment,
      readyToFulfill,
      fulfilled,
      activeReturns,
      refundProcessing,
      lowStockVariants,
      salesRows,
      refundRows,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'AWAITING_PAYMENT' } }),
      this.prisma.order.count({
        where: { status: 'CONFIRMED', paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.order.count({
        where: { status: { in: ['DELIVERED', 'FULFILLED'] } },
      }),
      this.prisma.returnRequest.count({
        where: {
          status: { in: ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'] },
        },
      }),
      this.prisma.refund.count({
        where: { status: { in: ['REQUESTED', 'PROCESSING'] } },
      }),
      this.prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
      this.prisma.$queryRaw<SalesAggregate[]>(Prisma.sql`
        SELECT
          COUNT(*) FILTER (
            WHERE "createdAt" >= date_trunc('day', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          )::bigint AS "todayOrders",
          COALESCE(SUM("totalCents") FILTER (
            WHERE "createdAt" >= date_trunc('day', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          ), 0)::bigint AS "todayGrossSalesCents",
          COUNT(*) FILTER (
            WHERE "createdAt" >= date_trunc('month', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          )::bigint AS "monthOrders",
          COALESCE(SUM("totalCents") FILTER (
            WHERE "createdAt" >= date_trunc('month', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          ), 0)::bigint AS "monthGrossSalesCents"
        FROM "Order"
        WHERE "paymentStatus" IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')
      `),
      this.prisma.$queryRaw<RefundAggregate[]>(Prisma.sql`
        SELECT
          COALESCE(SUM("amountCents") FILTER (
            WHERE COALESCE("processedAt", "updatedAt") >=
              date_trunc('day', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          ), 0)::bigint AS "todayRefundsCents",
          COALESCE(SUM("amountCents") FILTER (
            WHERE COALESCE("processedAt", "updatedAt") >=
              date_trunc('month', NOW() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone}
          ), 0)::bigint AS "monthRefundsCents"
        FROM "Refund"
        WHERE "status" = 'REFUNDED'
      `),
    ]);

    const sales = salesRows[0];
    const refunds = refundRows[0];
    const todayOrders = Number(sales?.todayOrders ?? 0);
    const todayGrossSalesCents = Number(sales?.todayGrossSalesCents ?? 0);
    const monthOrders = Number(sales?.monthOrders ?? 0);
    const monthGrossSalesCents = Number(sales?.monthGrossSalesCents ?? 0);
    const todayRefundsCents = Number(refunds?.todayRefundsCents ?? 0);
    const monthRefundsCents = Number(refunds?.monthRefundsCents ?? 0);

    return {
      currency: settings.currency || 'MYR',
      timeZone,
      totalOrders,
      awaitingPayment,
      readyToFulfill,
      fulfilled,
      activeReturns,
      refundProcessing,
      lowStockVariants,
      todayOrders,
      todayGrossSalesCents,
      todayRefundsCents,
      todayNetSalesCents: todayGrossSalesCents - todayRefundsCents,
      monthOrders,
      monthGrossSalesCents,
      monthRefundsCents,
      monthNetSalesCents: monthGrossSalesCents - monthRefundsCents,
      averageOrderValueCents:
        monthOrders > 0 ? Math.round(monthGrossSalesCents / monthOrders) : 0,
    };
  }
}
