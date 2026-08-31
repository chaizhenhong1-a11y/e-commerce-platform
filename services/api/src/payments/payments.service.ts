import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { OrderAccessService } from '../orders/order-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: PaymentProviderRegistry,
    private readonly configService: ConfigService,
    private readonly orderAccess: OrderAccessService,
  ) {}

  async create(
    orderNumber: string,
    provider: PaymentProvider,
    userId?: string,
    guestToken?: string,
  ) {
    this.assertDevelopmentProviderAllowed(provider);
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    this.orderAccess.assertCanAccess(
      order,
      userId,
      guestToken,
    );

    if (
      order.status !== 'AWAITING_PAYMENT' ||
      order.paymentStatus !== 'PENDING'
    ) {
      throw new BadRequestException('Order is not awaiting payment.');
    }

    if (
      order.reservationExpiresAt &&
      order.reservationExpiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'Order inventory reservation has expired.',
      );
    }

    const latest = order.payments[0];

    if (latest?.status === 'PENDING' && latest.provider === provider) {
      const checkoutUrl = latest.providerRef
        ? await this.providers
            .get(provider)
            .resumeSession(latest.providerRef)
        : null;

      return {
        ...this.toResponse(latest),
        checkoutUrl,
      };
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider,
        amountCents: order.totalCents,
        currency: order.currency,
        attempts: {
          create: {
            status: 'PENDING',
            metadata: { stage: 'created' },
          },
        },
      },
      include: {
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    try {
      const session = await this.providers.get(provider).createSession({
        paymentId: payment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountCents: order.totalCents,
        currency: order.currency,
        customerEmail: order.email,
      });

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: session.providerRef,
        },
      });

      if (
        session.reservationExpiresAt &&
        (!order.reservationExpiresAt ||
          session.reservationExpiresAt > order.reservationExpiresAt)
      ) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            reservationExpiresAt:
              session.reservationExpiresAt,
          },
        });
      }

      if (payment.attempts[0]) {
        await this.prisma.paymentAttempt.update({
          where: { id: payment.attempts[0].id },
          data: {
            providerRef: session.providerRef,
            metadata: {
              stage: 'provider_session_created',
              ...(session.metadata ?? {}),
            },
          },
        });
      }

      return {
        ...this.toResponse(updated),
        checkoutUrl: session.checkoutUrl,
      };
    } catch (error) {
      await this.markPaymentFailed(
        payment.id,
        'PROVIDER_SESSION_FAILED',
        error instanceof Error
          ? error.message
          : 'Unable to create payment session.',
      );

      throw error;
    }
  }

  async findOne(
    id: string,
    userId?: string,
    guestToken?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    this.orderAccess.assertCanAccess(
      payment.order,
      userId,
      guestToken,
    );

    return this.toResponse(payment);
  }

  async confirmDevelopmentPayment(
    id: string,
    userId?: string,
    guestToken?: string,
  ) {
    this.assertDevelopmentProviderAllowed(
      PaymentProvider.MANUAL_TEST,
    );

    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    this.orderAccess.assertCanAccess(
      payment.order,
      userId,
      guestToken,
    );

    if (payment.provider !== PaymentProvider.MANUAL_TEST) {
      throw new BadRequestException(
        'This endpoint only supports development payments.',
      );
    }

    return this.confirmProviderPayment(
      payment.id,
      payment.providerRef,
    );
  }

  async confirmProviderPayment(
    paymentId: string,
    providerRef: string | null,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            order: {
              include: { items: true },
            },
            attempts: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (!payment) {
          throw new NotFoundException('Payment not found.');
        }

        if (payment.status === PaymentStatus.PAID) {
          return this.toResponse(payment);
        }

        if (
          payment.order.status !== 'AWAITING_PAYMENT' ||
          payment.order.paymentStatus !== 'PENDING'
        ) {
          throw new BadRequestException(
            'Order is not awaiting payment.',
          );
        }

        if (
          payment.order.reservationExpiresAt &&
          payment.order.reservationExpiresAt <= new Date()
        ) {
          throw new BadRequestException(
            'Order inventory reservation has expired.',
          );
        }

        for (const item of payment.order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (
            !inventory ||
            inventory.reserved < item.quantity ||
            inventory.quantity < item.quantity
          ) {
            throw new BadRequestException(
              `Reserved inventory is unavailable for ${item.productName}.`,
            );
          }

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: { decrement: item.quantity },
              reserved: { decrement: item.quantity },
            },
          });
        }

        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            providerRef: providerRef ?? payment.providerRef,
            failureCode: null,
            failureMessage: null,
          },
        });

        if (payment.attempts[0]) {
          await tx.paymentAttempt.update({
            where: { id: payment.attempts[0].id },
            data: {
              status: PaymentStatus.PAID,
              providerRef:
                providerRef ?? payment.attempts[0].providerRef,
            },
          });
        }

        await tx.payment.updateMany({
          where: {
            orderId: payment.order.id,
            id: { not: payment.id },
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.FAILED,
            failureCode: 'ORDER_PAID_ELSEWHERE',
            failureMessage:
              'Another payment attempt completed this order.',
          },
        });

        await tx.paymentAttempt.updateMany({
          where: {
            payment: {
              orderId: payment.order.id,
              id: { not: payment.id },
            },
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.FAILED,
          },
        });

        await tx.order.update({
          where: { id: payment.order.id },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            reservationExpiresAt: null,
          },
        });

        return this.toResponse(updated);
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async failProviderPayment(
    paymentId: string,
    failureCode: string,
    failureMessage: string,
  ) {
    return this.markPaymentFailed(
      paymentId,
      failureCode,
      failureMessage,
    );
  }

  private async markPaymentFailed(
    paymentId: string,
    failureCode: string,
    failureMessage: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          attempts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found.');
      }

      if (payment.status === PaymentStatus.PAID) {
        return this.toResponse(payment);
      }

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureCode,
          failureMessage,
        },
      });

      if (payment.attempts[0]) {
        await tx.paymentAttempt.update({
          where: { id: payment.attempts[0].id },
          data: {
            status: PaymentStatus.FAILED,
          },
        });
      }

      return this.toResponse(updated);
    });
  }

  private assertDevelopmentProviderAllowed(
    provider: PaymentProvider,
  ) {
    if (
      provider === PaymentProvider.MANUAL_TEST &&
      this.configService.get<string>('NODE_ENV') === 'production'
    ) {
      throw new ForbiddenException(
        'Development payments are disabled in production.',
      );
    }
  }

  private toResponse(payment: {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amountCents: number;
    currency: string;
    providerRef: string | null;
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      providerRef: payment.providerRef,
      checkoutUrl: null,
    };
  }
}
