import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { OrderAccessService } from '../orders/order-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

const FREE_SHIPPING_THRESHOLD_CENTS = 15000;
const STANDARD_SHIPPING_CENTS = 1000;
const RESERVATION_MINUTES = 30;
const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderAccess: OrderAccessService,
  ) {}

  async createOrder(input: CreateCheckoutDto, userId?: string) {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => this.createOrderInTransaction(tx, input, userId),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (this.isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_RETRIES) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Checkout could not be completed. Please try again.');
  }

  private async createOrderInTransaction(
    tx: Prisma.TransactionClient,
    input: CreateCheckoutDto,
    userId?: string,
  ) {
    const cart = await tx.cart.findUnique({
      where: { sessionId: input.sessionId },
      include: {
        order: true,
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    if (cart.order) {
      return this.toCheckoutResponse(cart.order.id, tx);
    }

    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException('Cart is no longer available for checkout.');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    let subtotalCents = 0;
    const orderItems: Array<{
      variantId: string;
      sku: string;
      productName: string;
      variantName: string;
      unitPriceCents: number;
      quantity: number;
      lineTotalCents: number;
    }> = [];

    for (const item of cart.items) {
      const { variant } = item;

      if (!variant.isActive || variant.product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `${variant.product.name} is no longer available.`,
        );
      }

      if (!variant.inventory) {
        throw new BadRequestException(
          `${variant.product.name} does not have inventory configured.`,
        );
      }

      const available =
        variant.inventory.quantity - variant.inventory.reserved;

      if (item.quantity > available) {
        throw new BadRequestException(
          `Only ${Math.max(available, 0)} unit(s) of ${variant.product.name} remain.`,
        );
      }

      const lineTotalCents = variant.priceCents * item.quantity;
      subtotalCents += lineTotalCents;

      orderItems.push({
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product.name,
        variantName: variant.name,
        unitPriceCents: variant.priceCents,
        quantity: item.quantity,
        lineTotalCents,
      });
    }

    const shippingCents =
      subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : STANDARD_SHIPPING_CENTS;
    const totalCents = subtotalCents + shippingCents;

    for (const item of cart.items) {
      const inventory = item.variant.inventory!;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reserved: {
            increment: item.quantity,
          },
        },
      });
    }

    const order = await tx.order.create({
      data: {
        orderNumber: this.createOrderNumber(),
        cartId: cart.id,
        userId: userId ?? null,
        email: input.email.trim().toLowerCase(),
        shippingMethod: 'STANDARD',
        currency: 'MYR',
        subtotalCents,
        shippingCents,
        totalCents,
        shippingName: input.fullName.trim(),
        shippingPhone: input.phone.trim(),
        shippingLine1: input.addressLine1.trim(),
        shippingLine2: input.addressLine2?.trim() || null,
        shippingCity: input.city.trim(),
        shippingState: input.state.trim(),
        shippingPostcode: input.postcode.trim().toUpperCase(),
        shippingCountryCode: 'MY',
        reservationExpiresAt: new Date(
          Date.now() + RESERVATION_MINUTES * 60 * 1000,
        ),
        items: {
          create: orderItems,
        },
      },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: 'CONVERTED',
        userId: null,
      },
    });

    return this.toCheckoutResponse(order.id, tx);
  }

  private async toCheckoutResponse(
    orderId: string,
    tx: Prisma.TransactionClient,
  ) {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      reservationExpiresAt: order.reservationExpiresAt,
      orderAccessToken: this.orderAccess.issueGuestToken(order),
      email: order.email,
      shipping: {
        fullName: order.shippingName,
        phone: order.shippingPhone,
        addressLine1: order.shippingLine1,
        addressLine2: order.shippingLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postcode: order.shippingPostcode,
        countryCode: order.shippingCountryCode,
      },
      items: order.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      })),
    };
  }

  private createOrderNumber() {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `TS-${stamp}-${suffix}`;
  }

  private isRetryableTransactionError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
}
