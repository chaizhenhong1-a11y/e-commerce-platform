import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertReviewDto } from './dto/upsert-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductReviews(productId: string, viewerUserId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        variants: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found.');
    }

    const [reviews, aggregate, myReview, canReview] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      viewerUserId
        ? this.prisma.review.findUnique({
            where: {
              userId_productId: {
                userId: viewerUserId,
                productId,
              },
            },
          })
        : Promise.resolve(null),
      viewerUserId
        ? this.hasVerifiedPurchase(
            viewerUserId,
            product.variants.map((variant) => variant.id),
          )
        : Promise.resolve(false),
    ]);

    return {
      summary: {
        averageRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count._all,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        verifiedPurchase: review.verifiedPurchase,
        authorName: this.publicAuthorName(
          review.user.firstName,
          review.user.lastName,
        ),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      viewer: {
        signedIn: Boolean(viewerUserId),
        canReview,
        myReview: myReview
          ? {
              id: myReview.id,
              rating: myReview.rating,
              title: myReview.title,
              body: myReview.body,
            }
          : null,
      },
    };
  }

  async upsertReview(
    userId: string,
    productId: string,
    dto: UpsertReviewDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        status: true,
        variants: { select: { id: true } },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found.');
    }

    const eligible = await this.hasVerifiedPurchase(
      userId,
      product.variants.map((variant) => variant.id),
    );

    if (!eligible) {
      throw new ForbiddenException(
        'Only customers who purchased this product can review it.',
      );
    }

    const title = dto.title?.trim() || null;
    const body = dto.body?.trim() || null;

    return this.prisma.review.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      create: {
        userId,
        productId,
        rating: dto.rating,
        title,
        body,
        verifiedPurchase: true,
      },
      update: {
        rating: dto.rating,
        title,
        body,
        verifiedPurchase: true,
      },
    });
  }

  async removeReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot remove this review.');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }

  private async hasVerifiedPurchase(
    userId: string,
    variantIds: string[],
  ) {
    if (variantIds.length === 0) {
      return false;
    }

    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        paymentStatus: 'PAID',
        status: { in: ['CONFIRMED', 'FULFILLED'] },
        items: {
          some: {
            variantId: { in: variantIds },
          },
        },
      },
      select: { id: true },
    });

    return Boolean(order);
  }

  private publicAuthorName(
    firstName: string,
    lastName: string | null,
  ) {
    const initial = lastName?.trim().charAt(0);
    return initial ? `${firstName} ${initial}.` : firstName;
  }
}
