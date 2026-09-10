import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderAccessService } from './order-access.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderAccess: OrderAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async getCustomerOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        returnRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
      discountCents: order.discountCents,
      couponCode: order.couponCode,
      couponName: order.couponName,
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
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      processingAt: order.processingAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      itemCount: order.items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      returnRequest: order.returnRequests[0]
        ? {
            id: order.returnRequests[0].id,
            status: order.returnRequests[0].status,
            reason: order.returnRequests[0].reason,
            requestedAt: order.returnRequests[0].requestedAt,
          }
        : null,
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
          discountCents: item.discountCents,
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
        refunds: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        returnRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            items: {
              include: { orderItem: true },
              orderBy: { createdAt: 'asc' },
            },
          },
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
      discountCents: order.discountCents,
      couponCode: order.couponCode,
      couponName: order.couponName,
      totalCents: order.totalCents,
      reservationExpiresAt: order.reservationExpiresAt,
      createdAt: order.createdAt,
      fulfillment: {
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        processingAt: order.processingAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
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
      refund: order.refunds[0]
        ? {
            id: order.refunds[0].id,
            status: order.refunds[0].status,
            reason: order.refunds[0].reason,
            amountCents: order.refunds[0].amountCents,
            requestedAt: order.refunds[0].requestedAt,
            processedAt: order.refunds[0].processedAt,
          }
        : null,
      returnRequest: order.returnRequests[0]
        ? {
            id: order.returnRequests[0].id,
            status: order.returnRequests[0].status,
            reason: order.returnRequests[0].reason,
            customerNote: order.returnRequests[0].customerNote,
            requestedAt: order.returnRequests[0].requestedAt,
            approvedAt: order.returnRequests[0].approvedAt,
            receivedAt: order.returnRequests[0].receivedAt,
            completedAt: order.returnRequests[0].completedAt,
            staffNote: order.returnRequests[0].staffNote,
            items: order.returnRequests[0].items.map((returnItem) => ({
              id: returnItem.id,
              orderItemId: returnItem.orderItemId,
              quantity: returnItem.quantity,
              condition: returnItem.condition,
              disposition: returnItem.disposition,
              inspectedAt: returnItem.inspectedAt,
              restockedAt: returnItem.restockedAt,
              productName: returnItem.orderItem.productName,
              variantName: returnItem.orderItem.variantName,
              sku: returnItem.orderItem.sku,
            })),
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
        discountCents: item.discountCents,
      })),
    };
  }

  async getStaffCommerceSummary() {
    const [
      totalOrders,
      awaitingPayment,
      readyToFulfill,
      fulfilled,
      activeReturns,
      refundProcessing,
      lowStockVariants,
    ] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'AWAITING_PAYMENT' } }),
      this.prisma.order.count({
        where: { status: 'CONFIRMED', paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.order.count({ where: { status: { in: ['DELIVERED', 'FULFILLED'] } } }),
      this.prisma.returnRequest.count({
        where: { status: { in: ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'] } },
      }),
      this.prisma.refund.count({ where: { status: { in: ['REQUESTED', 'PROCESSING'] } } }),
      this.prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
    ]);

    return {
      totalOrders,
      awaitingPayment,
      readyToFulfill,
      fulfilled,
      activeReturns,
      refundProcessing,
      lowStockVariants,
    };
  }

  async getStaffOrders(filters: {
    status?: string;
    paymentStatus?: string;
    query?: string;
  }) {
    const status = filters.status?.trim();
    const paymentStatus = filters.paymentStatus?.trim();
    const query = filters.query?.trim();

    const validStatuses = ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FULFILLED', 'CANCELLED', 'EXPIRED'];
    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException('Unknown order status filter.');
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      throw new BadRequestException('Unknown payment status filter.');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}),
        ...(query
          ? {
              OR: [
                { orderNumber: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { shippingName: { contains: query, mode: 'insensitive' } },
                { items: { some: { productName: { contains: query, mode: 'insensitive' } } } },
                { items: { some: { sku: { contains: query, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        refunds: { orderBy: { createdAt: 'desc' }, take: 1 },
        returnRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const variantIds = [...new Set(
      orders.flatMap((order) => order.items.map((item) => item.variantId)),
    )];
    const skus = [...new Set(
      orders.flatMap((order) => order.items.map((item) => item.sku)),
    )];

    const catalogVariants = variantIds.length || skus.length
      ? await this.prisma.productVariant.findMany({
          where: {
            OR: [
              ...(variantIds.length ? [{ id: { in: variantIds } }] : []),
              ...(skus.length ? [{ sku: { in: skus } }] : []),
            ],
          },
          select: {
            id: true,
            sku: true,
            product: {
              select: {
                images: {
                  orderBy: [
                    { isPrimary: 'desc' },
                    { sortOrder: 'asc' },
                    { createdAt: 'asc' },
                  ],
                  select: {
                    url: true,
                    altText: true,
                    variantId: true,
                    isPrimary: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const pickCatalogImage = (
      variant: (typeof catalogVariants)[number],
    ) => {
      const images = variant.product.images;
      return (
        images.find((image) => image.variantId === variant.id && image.isPrimary) ??
        images.find((image) => image.variantId === variant.id) ??
        images.find((image) => image.variantId === null && image.isPrimary) ??
        images.find((image) => image.isPrimary) ??
        images.find((image) => image.variantId === null) ??
        images[0] ??
        null
      );
    };

    const catalogByVariantId = new Map(
      catalogVariants.map((variant) => [
        variant.id,
        pickCatalogImage(variant),
      ] as const),
    );
    const catalogBySku = new Map(
      catalogVariants.map((variant) => [
        variant.sku,
        pickCatalogImage(variant),
      ] as const),
    );

    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      email: order.email,
      customerName: order.shippingName,
      currency: order.currency,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map((item) => ({
        id: item.id,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        imageUrl:
          catalogByVariantId.get(item.variantId)?.url ??
          catalogBySku.get(item.sku)?.url ??
          null,
        imageAltText:
          catalogByVariantId.get(item.variantId)?.altText ??
          catalogBySku.get(item.sku)?.altText ??
          null,
      })),
      latestRefund: order.refunds[0]
        ? { status: order.refunds[0].status, amountCents: order.refunds[0].amountCents }
        : null,
      latestReturn: order.returnRequests[0]
        ? { id: order.returnRequests[0].id, status: order.returnRequests[0].status }
        : null,
      canProcess: order.status === 'CONFIRMED' && order.paymentStatus === PaymentStatus.PAID,
      canShip: order.status === 'PROCESSING' && order.paymentStatus === PaymentStatus.PAID,
      canDeliver: order.status === 'SHIPPED' && order.paymentStatus === PaymentStatus.PAID,
      canFulfill: false,
    }));
  }

  async markProcessingForStaff(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status === 'PROCESSING') return order;
    if (order.status !== 'CONFIRMED' || order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid confirmed orders can enter processing.');
    }
    const updated = await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING', processingAt: new Date() } });
    await this.notifications.create({ userId: order.userId, type: 'SHIPPING', title: 'Order is being prepared', message: `Order ${order.orderNumber} is now being prepared for shipment.`, orderNumber: order.orderNumber, actionPath: `/orders/${order.orderNumber}` });
    return updated;
  }

  async shipForStaff(
    orderNumber: string,
    input: { courierName?: string; trackingNumber?: string; trackingUrl?: string },
  ) {
    const courierName = input.courierName?.trim();
    const trackingNumber = input.trackingNumber?.trim();
    const trackingUrl = input.trackingUrl?.trim() || null;
    if (!courierName || !trackingNumber) {
      throw new BadRequestException('Courier name and tracking number are required.');
    }
    if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
      throw new BadRequestException('Tracking URL must start with http:// or https://.');
    }
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== 'PROCESSING') {
      throw new BadRequestException('Only processing orders can be shipped.');
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only fully paid orders can be shipped.');
    }
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        courierName,
        trackingNumber,
        trackingUrl,
        shippedAt: new Date(),
      },
    });
    await this.notifications.create({ userId: order.userId, type: 'SHIPPING', title: 'Your order has shipped', message: `${courierName} · ${trackingNumber}`, orderNumber: order.orderNumber, actionPath: `/orders/${order.orderNumber}` });
    return updated;
  }

  async deliverForStaff(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status === 'DELIVERED' || order.status === 'FULFILLED') return order;
    if (order.status !== 'SHIPPED') {
      throw new BadRequestException('Only shipped orders can be marked delivered.');
    }
    const updated = await this.prisma.order.update({ where: { id: order.id }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
    await this.notifications.create({ userId: order.userId, type: 'SHIPPING', title: 'Order delivered', message: `Order ${order.orderNumber} has been marked delivered.`, orderNumber: order.orderNumber, actionPath: `/orders/${order.orderNumber}` });
    return updated;
  }

  async fulfillForStaff(orderNumber: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderNumber } });
      if (!order) throw new NotFoundException('Order not found.');
      if (order.status === 'FULFILLED') return order;
      if (order.status !== 'CONFIRMED' && order.status !== 'DELIVERED') {
        throw new BadRequestException('Only confirmed or delivered orders can use the legacy fulfilled transition.');
      }
      if (order.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException('Only fully paid orders can be fulfilled.');
      }
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'FULFILLED' },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
