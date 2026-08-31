import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(sessionId: string, userId?: string) {
    this.assertSessionId(sessionId);

    if (userId) {
      const cartId = await this.resolveAccountCart(userId, sessionId);
      return this.getCartById(cartId);
    }

    return this.prisma.cart.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId },
      include: this.cartInclude,
    });
  }

  async addItem(
    sessionId: string,
    variantId: string,
    quantity: number,
    userId?: string,
  ) {
    this.assertSessionId(sessionId);
    this.assertQuantity(quantity);

    const variant = await this.getPurchasableVariant(variantId);
    const cartId = userId
      ? await this.resolveAccountCart(userId, sessionId)
      : (
          await this.prisma.cart.upsert({
            where: { sessionId },
            update: {},
            create: { sessionId },
            select: { id: true },
          })
        ).id;

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
    });
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    this.assertAvailableStock(variant.inventory, nextQuantity);

    await this.prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
      update: { quantity: nextQuantity },
      create: {
        cartId,
        variantId,
        quantity: nextQuantity,
      },
    });

    return this.getCartById(cartId);
  }

  async updateItem(
    sessionId: string,
    itemId: string,
    quantity: number,
    userId?: string,
  ) {
    this.assertSessionId(sessionId);
    this.assertQuantity(quantity);

    const cartId = userId
      ? await this.resolveAccountCart(userId, sessionId)
      : null;

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: userId
          ? { id: cartId!, userId, status: 'ACTIVE' }
          : { sessionId, status: 'ACTIVE' },
      },
      include: {
        variant: {
          include: { inventory: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    if (!item.variant.isActive) {
      throw new BadRequestException('This product option is no longer available.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: item.variant.productId },
      select: { status: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new BadRequestException('This product is no longer available.');
    }

    this.assertAvailableStock(item.variant.inventory, quantity);

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCartById(item.cartId);
  }

  async removeItem(
    sessionId: string,
    itemId: string,
    userId?: string,
  ) {
    this.assertSessionId(sessionId);

    const cartId = userId
      ? await this.resolveAccountCart(userId, sessionId)
      : null;

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: userId
          ? { id: cartId!, userId, status: 'ACTIVE' }
          : { sessionId, status: 'ACTIVE' },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({
      where: { id: item.id },
    });

    return this.getCartById(item.cartId);
  }

  private async resolveAccountCart(
    userId: string,
    guestSessionId: string,
  ): Promise<string> {
    return this.prisma.$transaction(
      async (tx) => {
        const accountCart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: true,
          },
        });

        const guestCart = await tx.cart.findUnique({
          where: { sessionId: guestSessionId },
          include: {
            order: true,
            items: {
              include: {
                variant: {
                  include: { inventory: true },
                },
              },
            },
          },
        });

        if (!accountCart) {
          if (
            guestCart &&
            guestCart.status === 'ACTIVE' &&
            !guestCart.order &&
            guestCart.userId == null
          ) {
            const claimed = await tx.cart.update({
              where: { id: guestCart.id },
              data: { userId },
              select: { id: true },
            });
            return claimed.id;
          }

          const created = await tx.cart.create({
            data: {
              sessionId: this.accountSessionId(userId),
              userId,
            },
            select: { id: true },
          });
          return created.id;
        }

        if (
          !guestCart ||
          guestCart.id === accountCart.id ||
          guestCart.status !== 'ACTIVE' ||
          guestCart.order ||
          guestCart.userId != null
        ) {
          return accountCart.id;
        }

        const accountQuantities = new Map(
          accountCart.items.map((item) => [
            item.variantId,
            item.quantity,
          ]),
        );

        for (const guestItem of guestCart.items) {
          const available =
            (guestItem.variant.inventory?.quantity ?? 0) -
            (guestItem.variant.inventory?.reserved ?? 0);
          const existing = accountQuantities.get(guestItem.variantId) ?? 0;
          const mergedQuantity = Math.min(
            existing + guestItem.quantity,
            Math.max(available, 0),
            99,
          );

          if (mergedQuantity <= 0) {
            continue;
          }

          await tx.cartItem.upsert({
            where: {
              cartId_variantId: {
                cartId: accountCart.id,
                variantId: guestItem.variantId,
              },
            },
            update: { quantity: mergedQuantity },
            create: {
              cartId: accountCart.id,
              variantId: guestItem.variantId,
              quantity: mergedQuantity,
            },
          });
        }

        await tx.cart.delete({
          where: { id: guestCart.id },
        });

        return accountCart.id;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private accountSessionId(userId: string) {
    return `account:${userId}:${randomUUID()}`;
  }

  private async getPurchasableVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        isActive: true,
        product: { status: 'ACTIVE' },
      },
      include: { inventory: true },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found.');
    }

    return variant;
  }

  private getCartById(id: string) {
    return this.prisma.cart.findUniqueOrThrow({
      where: { id },
      include: this.cartInclude,
    });
  }

  private assertSessionId(sessionId: string) {
    if (!sessionId || sessionId.length > 128) {
      throw new BadRequestException('Invalid cart session.');
    }
  }

  private assertQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestException(
        'Quantity must be an integer between 1 and 99.',
      );
    }
  }

  private assertAvailableStock(
    inventory: { quantity: number; reserved: number } | null,
    quantity: number,
  ) {
    const available =
      (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0);

    if (quantity > available) {
      throw new BadRequestException('Insufficient stock.');
    }
  }

  private readonly cartInclude = {
    items: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: [
                    { isPrimary: 'desc' as const },
                    { sortOrder: 'asc' as const },
                  ],
                },
              },
            },
            inventory: true,
          },
        },
      },
    },
  };
}
