import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma, RefundStatus } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import { OrderAccessService } from '../../orders/order-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: PaymentProviderRegistry,
    private readonly orderAccess: OrderAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(
    orderNumber: string,
    reason: string,
    note: string | undefined,
    userId?: string,
    guestToken?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        refunds: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    this.orderAccess.assertCanAccess(order, userId, guestToken);

    if (order.status === 'FULFILLED') {
      throw new BadRequestException(
        'Fulfilled orders must use the return flow before any refund is issued.',
      );
    }
    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only paid confirmed orders can be refunded directly.',
      );
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order payment is not refundable.');
    }
    if (order.refunds[0]) {
      throw new BadRequestException(
        'A refund request already exists for this order.',
      );
    }

    const payment = order.payments[0];
    if (!payment?.providerRef) {
      throw new BadRequestException(
        'The completed payment cannot be matched to its provider.',
      );
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        reason,
        customerNote: note?.trim() || null,
        amountCents: order.totalCents,
        currency: order.currency,
        status: RefundStatus.REQUESTED,
      },
    });

    await this.notifications.create({
      userId: order.userId,
      type: 'REFUND',
      title: 'Refund requested',
      message: `Your refund request for order ${order.orderNumber} is waiting for staff review.`,
      orderNumber: order.orderNumber,
      actionPath: `/orders/${order.orderNumber}`,
      eventKey: `refund-requested:${refund.id}`,
    });

    return refund;
  }

  async listForStaff(status?: RefundStatus) {
    const refunds = await this.prisma.refund.findMany({
      where: status ? { status } : undefined,
      include: {
        order: {
          select: {
            orderNumber: true,
            email: true,
            shippingName: true,
            totalCents: true,
          },
        },
        payment: { select: { provider: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return refunds.map((refund) => ({
      id: refund.id,
      orderNumber: refund.order.orderNumber,
      customerName: refund.order.shippingName,
      email: refund.order.email,
      reason: refund.reason,
      customerNote: refund.customerNote,
      amountCents: refund.amountCents,
      orderTotalCents: refund.order.totalCents,
      currency: refund.currency,
      status: refund.status,
      provider: refund.payment.provider,
      requestedAt: refund.requestedAt,
      processedAt: refund.processedAt,
      failureMessage: refund.failureMessage,
    }));
  }

  async approve(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { order: true, payment: true },
    });
    if (!refund) throw new NotFoundException('Refund not found.');
    if (refund.returnRequestId) {
      throw new BadRequestException('Return refunds are handled by the return workflow.');
    }
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException('Only requested refunds can be approved.');
    }
    if (!refund.payment.providerRef) {
      throw new BadRequestException('The payment cannot be matched to its provider.');
    }

    const claimed = await this.prisma.refund.updateMany({
      where: { id: refund.id, status: RefundStatus.REQUESTED },
      data: {
        status: RefundStatus.PROCESSING,
        failureCode: null,
        failureMessage: null,
      },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException('Refund request is already being reviewed.');
    }

    await this.notifications.create({
      userId: refund.order.userId,
      type: 'REFUND',
      title: 'Refund approved',
      message: `Your refund for order ${refund.order.orderNumber} was approved and is being processed.`,
      orderNumber: refund.order.orderNumber,
      actionPath: `/orders/${refund.order.orderNumber}`,
      eventKey: `refund-approved:${refund.id}`,
    });

    try {
      const result = await this.providers.get(refund.payment.provider).refund({
        refundId: refund.id,
        paymentProviderRef: refund.payment.providerRef,
        amountCents: refund.amountCents,
        currency: refund.currency,
      });

      if (result.state === 'REFUNDED') {
        return this.markRefunded(refund.id, result.providerRef);
      }

      return this.prisma.refund.update({
        where: { id: refund.id },
        data: { providerRef: result.providerRef },
      });
    } catch (error) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.FAILED,
          failureCode: 'PROVIDER_REFUND_FAILED',
          failureMessage:
            error instanceof Error ? error.message : 'Refund provider failed.',
          processedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async reject(refundId: string, note?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { order: true },
    });
    if (!refund) throw new NotFoundException('Refund not found.');
    if (refund.returnRequestId) {
      throw new BadRequestException('Return refunds are handled by the return workflow.');
    }
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException('Only requested refunds can be rejected.');
    }

    const message = note?.trim() || 'Refund request was not approved by staff.';
    const claimed = await this.prisma.refund.updateMany({
      where: { id: refund.id, status: RefundStatus.REQUESTED },
      data: {
        status: RefundStatus.REJECTED,
        failureCode: 'STAFF_REJECTED',
        failureMessage: message,
        processedAt: new Date(),
      },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException('Refund request is already being reviewed.');
    }

    await this.notifications.create({
      userId: refund.order.userId,
      type: 'REFUND',
      title: 'Refund request not approved',
      message: `Your refund request for order ${refund.order.orderNumber} was not approved.`,
      orderNumber: refund.order.orderNumber,
      actionPath: `/orders/${refund.order.orderNumber}`,
      eventKey: `refund-rejected:${refund.id}`,
    });

    return this.prisma.refund.findUnique({ where: { id: refund.id } });
  }

  async issueForReturn(returnRequestId: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: {
          include: {
            payments: {
              where: {
                status: {
                  in: [
                    PaymentStatus.PAID,
                    PaymentStatus.PARTIALLY_REFUNDED,
                  ],
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        items: { include: { orderItem: true } },
        refund: true,
      },
    });

    if (!request) throw new NotFoundException('Return request not found.');
    if (request.status !== 'RECEIVED') {
      throw new BadRequestException(
        'Returned goods must be received before a refund can be issued.',
      );
    }
    if (request.refund) return request.refund;

    const payment = request.order.payments[0];
    if (!payment?.providerRef) {
      throw new BadRequestException(
        'The completed payment cannot be matched to its provider.',
      );
    }

    const grossReturnCents = request.items.reduce(
      (total, item) =>
        total + item.orderItem.unitPriceCents * item.quantity,
      0,
    );
    const merchandiseNetCents = Math.max(
      0,
      request.order.subtotalCents - request.order.discountCents,
    );
    const amountCents =
      request.order.subtotalCents > 0
        ? Math.floor(
            (grossReturnCents * merchandiseNetCents) /
              request.order.subtotalCents,
          )
        : 0;
    if (amountCents <= 0) {
      throw new BadRequestException('Return refund amount is invalid.');
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: request.order.id,
        paymentId: payment.id,
        returnRequestId: request.id,
        reason: `RETURN_${request.reason}`,
        customerNote: request.customerNote,
        amountCents,
        currency: request.order.currency,
        status: RefundStatus.PROCESSING,
      },
    });

    try {
      const result = await this.providers.get(payment.provider).refund({
        refundId: refund.id,
        paymentProviderRef: payment.providerRef,
        amountCents: refund.amountCents,
        currency: refund.currency,
      });

      if (result.state === 'REFUNDED') {
        return this.markRefunded(refund.id, result.providerRef);
      }

      return this.prisma.refund.update({
        where: { id: refund.id },
        data: { providerRef: result.providerRef },
      });
    } catch (error) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.FAILED,
          failureCode: 'RETURN_REFUND_FAILED',
          failureMessage:
            error instanceof Error ? error.message : 'Return refund failed.',
          processedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async syncStripeRefund(
    refundId: string,
    providerRef: string,
    stripeStatus: string | null,
    failureMessage?: string | null,
  ) {
    if (stripeStatus === 'succeeded') {
      return this.markRefunded(refundId, providerRef);
    }

    const status =
      stripeStatus === 'failed' || stripeStatus === 'canceled'
        ? RefundStatus.FAILED
        : RefundStatus.PROCESSING;

    return this.prisma.refund.update({
      where: { id: refundId },
      data: {
        providerRef,
        status,
        failureCode: status === RefundStatus.FAILED ? 'STRIPE_REFUND_FAILED' : null,
        failureMessage: status === RefundStatus.FAILED ? failureMessage ?? 'Stripe refund failed.' : null,
        processedAt: status === RefundStatus.FAILED ? new Date() : null,
      },
    });
  }

  private async markRefunded(refundId: string, providerRef: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const refund = await tx.refund.findUnique({
          where: { id: refundId },
          include: { order: true, payment: true },
        });
        if (!refund) throw new NotFoundException('Refund not found.');
        if (refund.status === RefundStatus.REFUNDED) return refund;

        const updated = await tx.refund.update({
          where: { id: refund.id },
          data: {
            providerRef,
            status: RefundStatus.REFUNDED,
            failureCode: null,
            failureMessage: null,
            processedAt: new Date(),
          },
        });
        const refunded = await tx.refund.aggregate({
          where: {
            orderId: refund.orderId,
            status: RefundStatus.REFUNDED,
          },
          _sum: { amountCents: true },
        });
        const totalRefunded = refunded._sum.amountCents ?? 0;
        const financialStatus =
          totalRefunded >= refund.order.totalCents
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;

        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: financialStatus },
        });
        await tx.order.update({
          where: { id: refund.orderId },
          data: { paymentStatus: financialStatus },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { order: true },
    });
    if (refund) {
      await this.notifications.create({
        userId: refund.order.userId,
        type: 'REFUND',
        title: 'Refund completed',
        message: `Your refund for order ${refund.order.orderNumber} has been completed.`,
        orderNumber: refund.order.orderNumber,
        actionPath: `/orders/${refund.order.orderNumber}`,
        eventKey: `refund-completed:${refund.id}`,
      });
    }
    return result;
  }
}
