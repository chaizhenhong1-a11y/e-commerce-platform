import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CouponDiscountType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveCouponDto } from './dto/save-coupon.dto';
import { SaveAutomaticPromotionDto } from './dto/save-automatic-promotion.dto';

type DbClient = PrismaService | Prisma.TransactionClient;

type EligibleCartItem = {
  quantity: number;
  variant: {
    priceCents: number;
    product: { id: string; categoryId: string | null };
  };
};

const inactiveOrderStatuses: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.EXPIRED,
];

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeCode(code: string) {
    return code.trim().toUpperCase().replace(/\s+/g, '');
  }

  async validateForCart(sessionId: string, code: string, userId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!cart || cart.status !== 'ACTIVE' || cart.items.length === 0) {
      throw new BadRequestException('Cart is not available for coupon validation.');
    }

    const subtotalCents = cart.items.reduce(
      (sum, item) => sum + item.variant.priceCents * item.quantity,
      0,
    );

    return this.evaluateCoupon(
      this.prisma,
      this.normalizeCode(code),
      cart.items,
      subtotalCents,
      userId,
    );
  }

  async evaluateCoupon(
    db: DbClient,
    normalizedCode: string,
    items: EligibleCartItem[],
    subtotalCents: number,
    userId?: string,
  ) {
    const coupon = await db.coupon.findUnique({
      where: { code: normalizedCode },
      include: {
        products: true,
        categories: true,
      },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Coupon is invalid or inactive.');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Coupon is not active yet.');
    }
    if (coupon.endsAt && coupon.endsAt <= now) {
      throw new BadRequestException('Coupon has expired.');
    }
    if (subtotalCents < coupon.minSubtotalCents) {
      throw new BadRequestException(
        `Coupon requires a minimum subtotal of RM ${(coupon.minSubtotalCents / 100).toFixed(2)}.`,
      );
    }

    const activeRedemptionWhere: Prisma.CouponRedemptionWhereInput = {
      couponId: coupon.id,
      order: { status: { notIn: inactiveOrderStatuses } },
    };

    if (coupon.usageLimit) {
      const used = await db.couponRedemption.count({ where: activeRedemptionWhere });
      if (used >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit has been reached.');
      }
    }

    if (coupon.perUserLimit && !userId) {
      throw new BadRequestException('Sign in to use this account-limited coupon.');
    }

    if (coupon.perUserLimit && userId) {
      const usedByUser = await db.couponRedemption.count({
        where: { ...activeRedemptionWhere, userId },
      });
      if (usedByUser >= coupon.perUserLimit) {
        throw new BadRequestException('You have already used this coupon.');
      }
    }

    const productIds = new Set(coupon.products.map((item) => item.productId));
    const categoryIds = new Set(
      coupon.categories.map((item) => item.categoryId),
    );
    const unrestricted = productIds.size === 0 && categoryIds.size === 0;

    let eligibleSubtotalCents = 0;
    for (const item of items) {
      const product = item.variant.product;
      const eligible =
        unrestricted ||
        productIds.has(product.id) ||
        (product.categoryId ? categoryIds.has(product.categoryId) : false);
      if (eligible) {
        eligibleSubtotalCents += item.variant.priceCents * item.quantity;
      }
    }

    if (eligibleSubtotalCents <= 0) {
      throw new BadRequestException('Coupon does not apply to items in this cart.');
    }

    let discountCents =
      coupon.discountType === CouponDiscountType.PERCENTAGE
        ? Math.floor((eligibleSubtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, eligibleSubtotalCents);

    if (coupon.maxDiscountCents) {
      discountCents = Math.min(discountCents, coupon.maxDiscountCents);
    }
    discountCents = Math.max(0, Math.min(discountCents, subtotalCents));

    if (discountCents <= 0) {
      throw new BadRequestException('Coupon does not create a discount.');
    }

    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      value: coupon.value,
      discountCents,
      eligibleSubtotalCents,
      minSubtotalCents: coupon.minSubtotalCents,
      maxDiscountCents: coupon.maxDiscountCents,
      eligibleProductIds: [...new Set(items.filter((item) => {
        const product = item.variant.product;
        return unrestricted || productIds.has(product.id) ||
          (product.categoryId ? categoryIds.has(product.categoryId) : false);
      }).map((item) => item.variant.product.id))],
    };
  }

  async listStaffCoupons() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        products: true,
        categories: true,
        _count: { select: { redemptions: true } },
      },
    });

    return coupons.map((coupon) => ({
      ...coupon,
      productIds: coupon.products.map((item) => item.productId),
      categoryIds: coupon.categories.map((item) => item.categoryId),
      products: undefined,
      categories: undefined,
    }));
  }

  async createCoupon(input: SaveCouponDto) {
    const data = await this.buildSaveData(input);
    try {
      return await this.prisma.coupon.create({
        data: {
          ...data.scalar,
          products: { create: data.productIds.map((productId) => ({ productId })) },
          categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Coupon code already exists.');
      }
      throw error;
    }
  }

  async updateCoupon(id: string, input: SaveCouponDto) {
    await this.ensureCouponExists(id);
    const data = await this.buildSaveData(input);
    try {
      return await this.prisma.coupon.update({
        where: { id },
        data: {
          ...data.scalar,
          products: {
            deleteMany: {},
            create: data.productIds.map((productId) => ({ productId })),
          },
          categories: {
            deleteMany: {},
            create: data.categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Coupon code already exists.');
      }
      throw error;
    }
  }

  async deactivateCoupon(id: string) {
    await this.ensureCouponExists(id);
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async ensureCouponExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found.');
    return coupon;
  }

  private async buildSaveData(input: SaveCouponDto) {
    if (
      input.discountType === CouponDiscountType.PERCENTAGE &&
      input.value > 100
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%.');
    }
    if (input.endsAt && input.startsAt && new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new BadRequestException('Coupon end time must be after its start time.');
    }

    const normalizedCode = this.normalizeCode(input.code);
    if (!normalizedCode || !/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      throw new BadRequestException('Coupon code may contain only letters, numbers, hyphens, and underscores.');
    }

    const productIds = [...new Set(input.productIds.filter(Boolean))];
    const categoryIds = [...new Set(input.categoryIds.filter(Boolean))];

    const [productCount, categoryCount] = await Promise.all([
      productIds.length
        ? this.prisma.product.count({ where: { id: { in: productIds } } })
        : 0,
      categoryIds.length
        ? this.prisma.category.count({ where: { id: { in: categoryIds } } })
        : 0,
    ]);
    if (productCount !== productIds.length || categoryCount !== categoryIds.length) {
      throw new BadRequestException('One or more coupon scope selections are invalid.');
    }

    return {
      scalar: {
        code: normalizedCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        discountType: input.discountType,
        value: input.value,
        minSubtotalCents: input.minSubtotalCents,
        maxDiscountCents: input.maxDiscountCents ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        usageLimit: input.usageLimit ?? null,
        perUserLimit: input.perUserLimit ?? null,
        isActive: input.isActive,
      },
      productIds,
      categoryIds,
    };
  }

  async previewAutomaticForCart(sessionId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    if (!cart || cart.status !== 'ACTIVE' || cart.items.length === 0) {
      return { automaticPromotion: null };
    }

    const subtotalCents = cart.items.reduce(
      (sum, item) => sum + item.variant.priceCents * item.quantity,
      0,
    );
    const promotion = await this.evaluateBestAutomaticPromotion(
      this.prisma,
      cart.items,
      subtotalCents,
    );

    return {
      automaticPromotion: promotion
        ? {
            id: promotion.id,
            name: promotion.name,
            discountCents: promotion.discountCents,
          }
        : null,
    };
  }

  async evaluateBestAutomaticPromotion(
    db: DbClient,
    items: EligibleCartItem[],
    subtotalCents: number,
  ) {
    const now = new Date();
    const promotions = await db.automaticPromotion.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
        minSubtotalCents: { lte: subtotalCents },
      },
      include: { products: true, categories: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    let best: null | {
      id: string; name: string; discountCents: number;
      eligibleSubtotalCents: number; eligibleProductIds: string[]; priority: number;
    } = null;

    for (const promotion of promotions) {
      const productIds = new Set(promotion.products.map((item) => item.productId));
      const categoryIds = new Set(promotion.categories.map((item) => item.categoryId));
      const unrestricted = productIds.size === 0 && categoryIds.size === 0;
      const eligibleItems = items.filter((item) => {
        const product = item.variant.product;
        return unrestricted || productIds.has(product.id) ||
          (product.categoryId ? categoryIds.has(product.categoryId) : false);
      });
      const eligibleSubtotalCents = eligibleItems.reduce(
        (sum, item) => sum + item.variant.priceCents * item.quantity, 0,
      );
      if (eligibleSubtotalCents <= 0) continue;
      let discountCents = promotion.discountType === CouponDiscountType.PERCENTAGE
        ? Math.floor((eligibleSubtotalCents * promotion.value) / 100)
        : Math.min(promotion.value, eligibleSubtotalCents);
      if (promotion.maxDiscountCents) discountCents = Math.min(discountCents, promotion.maxDiscountCents);
      discountCents = Math.max(0, Math.min(discountCents, subtotalCents));
      if (discountCents <= 0) continue;
      const candidate = {
        id: promotion.id,
        name: promotion.name,
        discountCents,
        eligibleSubtotalCents,
        eligibleProductIds: [...new Set(eligibleItems.map((item) => item.variant.product.id))],
        priority: promotion.priority,
      };
      if (!best || candidate.discountCents > best.discountCents ||
          (candidate.discountCents === best.discountCents && candidate.priority > best.priority)) {
        best = candidate;
      }
    }
    return best;
  }

  async listAutomaticPromotions() {
    const rows = await this.prisma.automaticPromotion.findMany({
      include: { products: true, categories: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((item) => ({
      ...item,
      productIds: item.products.map((x) => x.productId),
      categoryIds: item.categories.map((x) => x.categoryId),
      products: undefined,
      categories: undefined,
    }));
  }

  async createAutomaticPromotion(input: SaveAutomaticPromotionDto) {
    const data = await this.buildAutomaticSaveData(input);
    return this.prisma.automaticPromotion.create({
      data: {
        ...data.scalar,
        products: { create: data.productIds.map((productId) => ({ productId })) },
        categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
      },
    });
  }

  async updateAutomaticPromotion(id: string, input: SaveAutomaticPromotionDto) {
    const existing = await this.prisma.automaticPromotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Automatic promotion not found.');
    const data = await this.buildAutomaticSaveData(input);
    return this.prisma.automaticPromotion.update({
      where: { id },
      data: {
        ...data.scalar,
        products: { deleteMany: {}, create: data.productIds.map((productId) => ({ productId })) },
        categories: { deleteMany: {}, create: data.categoryIds.map((categoryId) => ({ categoryId })) },
      },
    });
  }

  async deactivateAutomaticPromotion(id: string) {
    const existing = await this.prisma.automaticPromotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Automatic promotion not found.');
    return this.prisma.automaticPromotion.update({ where: { id }, data: { isActive: false } });
  }

  private async buildAutomaticSaveData(input: SaveAutomaticPromotionDto) {
    if (input.discountType === CouponDiscountType.PERCENTAGE && input.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%.');
    }
    if (input.endsAt && input.startsAt && new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new BadRequestException('Promotion end time must be after its start time.');
    }
    const productIds = [...new Set(input.productIds.filter(Boolean))];
    const categoryIds = [...new Set(input.categoryIds.filter(Boolean))];
    const [productCount, categoryCount] = await Promise.all([
      productIds.length ? this.prisma.product.count({ where: { id: { in: productIds } } }) : 0,
      categoryIds.length ? this.prisma.category.count({ where: { id: { in: categoryIds } } }) : 0,
    ]);
    if (productCount !== productIds.length || categoryCount !== categoryIds.length) {
      throw new BadRequestException('One or more automatic promotion scope selections are invalid.');
    }
    return {
      scalar: {
        name: input.name.trim(), description: input.description?.trim() || null,
        discountType: input.discountType, value: input.value,
        minSubtotalCents: input.minSubtotalCents,
        maxDiscountCents: input.maxDiscountCents ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        priority: input.priority, isActive: input.isActive,
      }, productIds, categoryIds,
    };
  }

}
