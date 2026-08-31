import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CatalogSort = 'newest' | 'price-asc' | 'price-desc' | 'name';

type CatalogQuery = {
  query?: string;
  category?: string;
  sort?: string;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: CatalogQuery = {}) {
    const query = filters.query?.trim();
    const category = filters.category?.trim();
    const sort = this.normalizeSort(filters.sort);

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(category
          ? {
              category: {
                name: {
                  equals: category,
                  mode: 'insensitive',
                },
              },
            }
          : {}),
        ...(query
          ? {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  category: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  variants: {
                    some: {
                      isActive: true,
                      OR: [
                        {
                          name: {
                            contains: query,
                            mode: 'insensitive',
                          },
                        },
                        {
                          sku: {
                            contains: query,
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy:
        sort === 'name'
          ? { name: 'asc' }
          : { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        variants: {
          where: { isActive: true },
          orderBy: { priceCents: 'asc' },
          include: { inventory: true },
        },
      },
    });

    if (sort === 'price-asc' || sort === 'price-desc') {
      products.sort((left, right) => {
        const leftPrice = left.variants[0]?.priceCents ?? Number.MAX_SAFE_INTEGER;
        const rightPrice =
          right.variants[0]?.priceCents ?? Number.MAX_SAFE_INTEGER;
        const difference = leftPrice - rightPrice;
        return sort === 'price-asc' ? difference : -difference;
      });
    }

    return products;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        variants: {
          where: { isActive: true },
          orderBy: { priceCents: 'asc' },
          include: { inventory: true },
        },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  private normalizeSort(value?: string): CatalogSort {
    if (
      value === 'price-asc' ||
      value === 'price-desc' ||
      value === 'name'
    ) {
      return value;
    }

    return 'newest';
  }
}
