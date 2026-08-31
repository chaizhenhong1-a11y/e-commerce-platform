import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAccessService } from './order-access.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderAccess: OrderAccessService,
  ) {}

  async getCustomerOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const variantIds = [
      ...new Set(
        orders.flatMap((order) =>
          order.items.map((item) => item.variantId),
        ),
      ),
    ];

    const variants = variantIds.length
      ? await this.prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            product: {
              select: {
                slug: true,
                images: {
                  orderBy: [
                    { isPrimary: 'desc' },
                    { sortOrder: 'asc' },
                  ],
                  select: {
                    url: true,
                    variantId: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const variantCatalog = new Map(
      variants.map((variant) => [
        variant.id,
        {
          productSlug: variant.product.slug,
          imageUrl:
            variant.product.images.find(
              (image) => image.variantId === variant.id,
            )?.url ??
            variant.product.images.find(
              (image) => image.variantId === null,
            )?.url ??
            variant.product.images[0]?.url ??
            null,
        },
      ]),
    );

    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      shippingMethod: order.shippingMethod,
      shipping: {
        city: order.shippingCity,
        state: order.shippingState,
        postcode: order.shippingPostcode,
        countryCode: order.shippingCountryCode,
      },
      reservationExpiresAt: order.reservationExpiresAt,
      createdAt: order.createdAt,
      itemCount: order.items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      items: order.items.map((item) => {
        const catalog = variantCatalog.get(item.variantId);

        return {
          id: item.id,
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          productSlug: catalog?.productSlug ?? null,
          imageUrl: catalog?.imageUrl ?? null,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
        };
      }),
    }));
  }

  async getStatus(
    orderNumber: string,
    userId?: string,
    guestToken?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
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

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      email: order.email,
      currency: order.currency,
      shippingMethod: order.shippingMethod,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      reservationExpiresAt: order.reservationExpiresAt,
      createdAt: order.createdAt,
      shipping: {
        fullName: order.shippingName,
        phone: order.shippingPhone,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postcode: order.shippingPostcode,
        countryCode: order.shippingCountryCode,
      },
      payment: order.payments[0]
        ? {
            id: order.payments[0].id,
            provider: order.payments[0].provider,
            status: order.payments[0].status,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      })),
    };
  }

  async cancelOrder(
    orderNumber: string,
    userId?: string,
    guestToken?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          include: { items: true },
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
          throw new BadRequestException(
            'Only unpaid orders awaiting payment can be cancelled.',
          );
        }

        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (!inventory) {
            continue;
          }

          const releasable = Math.min(
            inventory.reserved,
            item.quantity,
          );

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
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.FAILED,
            failureCode: 'ORDER_CANCELLED',
            failureMessage:
              'The customer cancelled the order before payment completed.',
          },
        });

        await tx.paymentAttempt.updateMany({
          where: {
            payment: { orderId: order.id },
            status: PaymentStatus.PENDING,
          },
          data: { status: PaymentStatus.FAILED },
        });

        const cancelled = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            reservationExpiresAt: null,
          },
        });

        return {
          orderNumber: cancelled.orderNumber,
          status: cancelled.status,
          paymentStatus: cancelled.paymentStatus,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }


}
