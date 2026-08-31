import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderExpirationService {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireUnpaidOrders() {
    const candidates = await this.prisma.order.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
        reservationExpiresAt: { lte: new Date() },
      },
      select: { id: true },
      take: 50,
    });

    for (const candidate of candidates) {
      try {
        await this.expireOrder(candidate.id);
      } catch (error) {
        this.logger.error(
          `Failed to expire order ${candidate.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async expireOrder(orderId: string) {
    const expired = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (
          !order ||
          order.status !== 'AWAITING_PAYMENT' ||
          order.paymentStatus !== 'PENDING' ||
          !order.reservationExpiresAt ||
          order.reservationExpiresAt > new Date()
        ) {
          return false;
        }

        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (!inventory) {
            continue;
          }

          const releasable = Math.min(inventory.reserved, item.quantity);

          if (releasable > 0) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                reserved: { decrement: releasable },
              },
            });
          }
        }

        await tx.payment.updateMany({
          where: {
            orderId: order.id,
            status: 'PENDING',
          },
          data: {
            status: PaymentStatus.FAILED,
            failureCode: 'ORDER_EXPIRED',
            failureMessage:
              'The inventory reservation expired before payment completed.',
          },
        });

        await tx.paymentAttempt.updateMany({
          where: {
            payment: { orderId: order.id },
            status: 'PENDING',
          },
          data: { status: PaymentStatus.FAILED },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'EXPIRED',
            paymentStatus: 'FAILED',
            reservationExpiresAt: null,
          },
        });

        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (expired) {
      this.logger.log(`Expired unpaid order ${orderId} and released inventory.`);
    }
  }
}
