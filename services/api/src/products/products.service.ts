import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MediaStorageService, type UploadedImageFile } from '../media/media-storage.service';
import { PrismaService } from '../prisma/prisma.service';

type CatalogSort = 'newest' | 'price-asc' | 'price-desc' | 'name';

type CatalogQuery = {
  query?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  async findAll(filters: CatalogQuery = {}) {
    const query = filters.query?.trim();
    const category = filters.category?.trim();
    const sort = this.normalizeSort(filters.sort);
    const minPriceCents = this.toPriceCents(filters.minPrice);
    const maxPriceCents = this.toPriceCents(filters.maxPrice);

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

    const filteredProducts = products
      .map((product) => ({
        ...product,
        variants: product.variants.filter((variant) => {
          const available = Math.max(
            0,
            (variant.inventory?.quantity ?? 0) -
              (variant.inventory?.reserved ?? 0),
          );
          if (filters.inStock === true && available <= 0) return false;
          if (minPriceCents != null && variant.priceCents < minPriceCents) {
            return false;
          }
          if (maxPriceCents != null && variant.priceCents > maxPriceCents) {
            return false;
          }
          return true;
        }),
      }))
      .filter((product) => product.variants.length > 0);

    if (sort === 'price-asc' || sort === 'price-desc') {
      filteredProducts.sort((left, right) => {
        const leftPrice = left.variants[0]?.priceCents ?? Number.MAX_SAFE_INTEGER;
        const rightPrice =
          right.variants[0]?.priceCents ?? Number.MAX_SAFE_INTEGER;
        const difference = leftPrice - rightPrice;
        return sort === 'price-asc' ? difference : -difference;
      });
    }

    if (filters.page == null && filters.limit == null) {
      return filteredProducts;
    }

    const page = Math.max(1, Math.trunc(filters.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.trunc(filters.limit ?? 24)));
    const total = filteredProducts.length;
    const start = (page - 1) * limit;
    const items = filteredProducts.slice(start, start + limit);

    return {
      items,
      page,
      limit,
      total,
      hasMore: start + items.length < total,
    };
  }

  async catalogMetadata() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        category: {
          select: { name: true },
        },
        variants: {
          where: { isActive: true },
          select: { priceCents: true },
        },
      },
    });

    const categories = Array.from(
      new Set(
        products
          .map((product) => product.category?.name?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    const prices = products.flatMap((product) =>
      product.variants.map((variant) => variant.priceCents),
    );

    if (prices.length === 0) {
      return {
        categories,
        minPrice: null,
        maxPrice: null,
      };
    }

    return {
      categories,
      minPrice: Math.min(...prices) / 100,
      maxPrice: Math.max(...prices) / 100,
    };
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

  async listForStaff(filters: { q?: string; status?: import('@prisma/client').ProductStatus; lowStock?: boolean }) {
    const q = filters.q?.trim();
    return this.prisma.product.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(q ? { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
        ] } : {}),
        ...(filters.lowStock ? { variants: { some: { inventory: { quantity: { lte: 5 } } } } } : {}),
      },
      include: {
        category: true,
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        variants: { orderBy: { createdAt: 'asc' }, include: { inventory: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async staffEditorOptions() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    });
    return { categories };
  }

  async getProductForStaff(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] },
        variants: {
          orderBy: { createdAt: 'asc' },
          include: { inventory: true },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async createProductForStaff(data: {
    name: string;
    slug: string;
    description?: string;
    details?: Record<string, unknown>;
    colorSwatches?: Record<string, string>;
    categoryId?: string | null;
    status?: import('@prisma/client').ProductStatus;
    isFeatured?: boolean;
  }) {
    const clean = await this.validateStaffProductInput(data);
    if (clean.status === 'ACTIVE') {
      throw new BadRequestException('Create the product as DRAFT, add an active SKU, then publish it.');
    }
    try {
      return await this.prisma.product.create({
        data: clean,
        include: { category: true, images: true, variants: { include: { inventory: true } } },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new BadRequestException('Product slug is already in use.');
      throw error;
    }
  }

  async saveProductForStaff(productId: string, data: {
    name: string;
    slug: string;
    description?: string;
    details?: Record<string, unknown>;
    colorSwatches?: Record<string, string>;
    categoryId?: string | null;
    status?: import('@prisma/client').ProductStatus;
    isFeatured?: boolean;
  }) {
    await this.requireProduct(productId);
    const clean = await this.validateStaffProductInput(data);
    if (clean.status === 'ACTIVE') await this.ensureProductCanPublish(productId);
    try {
      return await this.prisma.product.update({
        where: { id: productId },
        data: clean,
        include: { category: true },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new BadRequestException('Product slug is already in use.');
      throw error;
    }
  }

  async createVariantForStaff(productId: string, data: {
    sku: string;
    name: string;
    priceCents: number;
    compareAtCents?: number | null;
    currency?: string;
    isActive?: boolean;
    initialQuantity?: number;
    optionValues?: Record<string, string>;
  }) {
    await this.requireProduct(productId);
    const clean = this.validateVariantInput(data);
    try {
      return await this.prisma.productVariant.create({
        data: {
          productId,
          ...clean,
          inventory: { create: { quantity: data.initialQuantity ?? 0, reserved: 0 } },
        },
        include: { inventory: true },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new BadRequestException('SKU is already in use.');
      throw error;
    }
  }

  async generateVariantMatrixForStaff(productId: string, data: {
    options: unknown[];
    skuPrefix: string;
    priceCents: number;
    compareAtCents?: number | null;
    currency?: string;
    initialQuantity?: number;
  }) {
    await this.requireProduct(productId);
    const options = this.normalizeMatrixOptions(data.options);
    const skuPrefix = data.skuPrefix.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!skuPrefix) throw new BadRequestException('SKU prefix is required.');
    if (data.priceCents < 0) throw new BadRequestException('Price cannot be negative.');
    if (data.compareAtCents != null && data.compareAtCents < data.priceCents) {
      throw new BadRequestException('Compare-at price must be greater than or equal to the selling price.');
    }
    const initialQuantity = data.initialQuantity ?? 0;
    if (!Number.isInteger(initialQuantity) || initialQuantity < 0) {
      throw new BadRequestException('Initial inventory must be a non-negative integer.');
    }

    const combinations = options.reduce<Array<Record<string, string>>>(
      (matrix, option) => matrix.flatMap((row) => option.values.map((value) => ({ ...row, [option.name]: value }))),
      [{}],
    );
    if (combinations.length > 100) throw new BadRequestException('Variant matrix cannot exceed 100 combinations.');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.productVariant.findMany({ where: { productId }, select: { sku: true, optionValues: true } });
      const existingSignatures = new Set(existing.map((variant) => this.optionSignature(this.asOptionValues(variant.optionValues))));
      const existingSkus = new Set(existing.map((variant) => variant.sku));
      const created = [];

      for (const optionValues of combinations) {
        const signature = this.optionSignature(optionValues);
        if (existingSignatures.has(signature)) continue;
        const suffix = Object.values(optionValues).map((value) => this.slugSkuPart(value)).join('-');
        let sku = `${skuPrefix}-${suffix}`.slice(0, 80);
        let counter = 2;
        while (existingSkus.has(sku)) {
          const counterSuffix = `-${counter++}`;
          sku = `${`${skuPrefix}-${suffix}`.slice(0, 80 - counterSuffix.length)}${counterSuffix}`;
        }
        const name = Object.values(optionValues).join(' / ');
        const variant = await tx.productVariant.create({
          data: {
            productId,
            sku,
            name,
            priceCents: data.priceCents,
            compareAtCents: data.compareAtCents ?? null,
            currency: (data.currency ?? 'MYR').trim().toUpperCase(),
            isActive: true,
            optionValues,
            inventory: { create: { quantity: initialQuantity, reserved: 0 } },
          },
          include: { inventory: true },
        });
        created.push(variant);
        existingSkus.add(sku);
        existingSignatures.add(signature);
      }

      return { createdCount: created.length, skippedCount: combinations.length - created.length, variants: created };
    });
  }

  async saveVariantForStaff(variantId: string, data: {
    sku: string;
    name: string;
    priceCents: number;
    compareAtCents?: number | null;
    currency?: string;
    isActive?: boolean;
    optionValues?: Record<string, string>;
  }) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    const clean = this.validateVariantInput(data);
    try {
      return await this.prisma.productVariant.update({ where: { id: variantId }, data: clean });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new BadRequestException('SKU is already in use.');
      throw error;
    }
  }

  async deleteVariantForStaff(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { _count: { select: { cartItems: true, inventoryAdjustments: true } } },
    });
    if (!variant) throw new NotFoundException('Variant not found.');
    const orderCount = await this.prisma.orderItem.count({ where: { variantId } });
    if (orderCount > 0 || variant._count.cartItems > 0 || variant._count.inventoryAdjustments > 0) {
      await this.prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
      return { deleted: false, deactivated: true, message: 'SKU has commerce or inventory-audit history and was safely disabled instead of deleted.' };
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { deleted: true, deactivated: false };
  }

  async uploadImageForStaff(productId: string, file: UploadedImageFile, data: {
    altText?: string | null;
    variantId?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
  }) {
    await this.requireProduct(productId);
    await this.validateImageVariant(productId, data.variantId);
    const stored = await this.mediaStorage.saveCatalogImage(file);
    try {
      const image = await this.addImageForStaff(productId, {
        url: stored.url,
        altText: data.altText,
        variantId: data.variantId,
        sortOrder: data.sortOrder,
        isPrimary: data.isPrimary,
      });
      return { image, upload: { originalName: stored.originalName, mimeType: stored.mimeType, size: stored.size } };
    } catch (error) {
      await this.mediaStorage.deleteOwnedUrl(stored.url).catch(() => false);
      throw error;
    }
  }

  async addImageForStaff(productId: string, data: {
    url: string;
    altText?: string | null;
    variantId?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
  }) {
    await this.requireProduct(productId);
    await this.validateImageVariant(productId, data.variantId);
    const url = data.url.trim();
    if (!url) throw new BadRequestException('Image URL is required.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (data.isPrimary) await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
        return tx.productImage.create({
          data: {
            productId,
            url,
            altText: data.altText?.trim() || null,
            variantId: data.variantId || null,
            sortOrder: data.sortOrder ?? 0,
            isPrimary: data.isPrimary ?? false,
          },
        });
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new BadRequestException('This image URL already exists on the product.');
      throw error;
    }
  }

  async updateImageForStaff(imageId: string, data: {
    altText?: string | null;
    variantId?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
  }) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Product image not found.');
    await this.validateImageVariant(image.productId, data.variantId);
    return this.prisma.$transaction(async (tx) => {
      if (data.isPrimary) await tx.productImage.updateMany({ where: { productId: image.productId }, data: { isPrimary: false } });
      return tx.productImage.update({
        where: { id: imageId },
        data: {
          ...(data.altText !== undefined ? { altText: data.altText?.trim() || null } : {}),
          ...(data.variantId !== undefined ? { variantId: data.variantId || null } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
        },
      });
    });
  }

  async deleteImageForStaff(imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Product image not found.');
    await this.prisma.productImage.delete({ where: { id: imageId } });
    await this.mediaStorage.deleteOwnedUrl(image.url);
    return { deleted: true };
  }

  async updateProductForStaff(productId: string, data: { status?: import('@prisma/client').ProductStatus; isFeatured?: boolean }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found.');
    if (data.status === undefined && data.isFeatured === undefined) throw new BadRequestException('No product change supplied.');
    if (data.status === 'ACTIVE') await this.ensureProductCanPublish(productId);
    return this.prisma.product.update({ where: { id: productId }, data });
  }

  async deleteProductForStaff(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, variants: { select: { id: true } } },
    });
    if (!product) throw new NotFoundException('Product not found.');

    const variantIds = product.variants.map((variant) => variant.id);
    if (variantIds.length > 0) {
      const [orderCount, cartCount, adjustmentCount] = await Promise.all([
        this.prisma.orderItem.count({ where: { variantId: { in: variantIds } } }),
        this.prisma.cartItem.count({ where: { variantId: { in: variantIds } } }),
        this.prisma.inventoryAdjustment.count({ where: { variantId: { in: variantIds } } }),
      ]);
      if (orderCount > 0 || cartCount > 0 || adjustmentCount > 0) {
        if (product.status !== 'ARCHIVED') {
          await this.prisma.product.update({
            where: { id: productId },
            data: { status: 'ARCHIVED', isFeatured: false },
          });
        }
        return {
          deleted: false,
          archived: true,
          message: 'Product has order, cart, or inventory-audit history and was archived instead of permanently deleted.',
        };
      }
    }

    await this.prisma.product.delete({ where: { id: productId } });
    return { deleted: true, archived: false, message: 'Product permanently deleted.' };
  }

  async updateVariantForStaff(variantId: string, data: { isActive: boolean }) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    return this.prisma.productVariant.update({ where: { id: variantId }, data });
  }

  async adjustInventoryForStaff(variantId: string, delta: number, reason: string, actorUserId: string) {
    if (delta === 0) throw new BadRequestException('Inventory adjustment cannot be zero.');
    const cleanReason = reason.trim();
    if (!cleanReason) throw new BadRequestException('Inventory adjustment reason is required.');
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true } });
      if (!variant) throw new NotFoundException('Variant not found.');
      const inventory = variant.inventory ?? await tx.inventory.create({ data: { variantId, quantity: 0, reserved: 0 } });
      const next = inventory.quantity + delta;
      if (next < inventory.reserved) throw new BadRequestException(`Quantity cannot be below reserved stock (${inventory.reserved}).`);
      if (next < 0) throw new BadRequestException('Inventory quantity cannot be negative.');
      const updated = await tx.inventory.update({ where: { id: inventory.id }, data: { quantity: next } });
      const adjustment = await tx.inventoryAdjustment.create({ data: { variantId, actorUserId, delta, previousQuantity: inventory.quantity, newQuantity: next, reason: cleanReason } });
      return { inventory: updated, adjustment };
    }, { isolationLevel: 'Serializable' });
  }

  async inventoryHistoryForStaff(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true } });
    if (!variant) throw new NotFoundException('Variant not found.');
    return this.prisma.inventoryAdjustment.findMany({
      where: { variantId }, orderBy: { createdAt: 'desc' }, take: 50,
      include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  private async ensureProductCanPublish(productId: string) {
    const activeVariant = await this.prisma.productVariant.findFirst({
      where: { productId, isActive: true },
      select: { id: true },
    });
    if (!activeVariant) {
      throw new BadRequestException('At least one active SKU is required before publishing.');
    }
  }

  private async requireProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  private async validateStaffProductInput(data: {
    name: string;
    slug: string;
    description?: string;
    details?: Record<string, unknown>;
    colorSwatches?: Record<string, string>;
    categoryId?: string | null;
    status?: import('@prisma/client').ProductStatus;
    isFeatured?: boolean;
  }) {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();
    if (!name) throw new BadRequestException('Product name is required.');
    if (!slug) throw new BadRequestException('Product slug is required.');
    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, isActive: true } });
      if (!category || !category.isActive) throw new BadRequestException('Choose an active category.');
    }
    return {
      name,
      slug,
      description: data.description?.trim() || null,
      details: this.normalizeProductDetails(data.details),
      colorSwatches: this.normalizeColorSwatches(data.colorSwatches),
      categoryId: data.categoryId || null,
      status: data.status ?? 'DRAFT',
      isFeatured: data.isFeatured ?? false,
    };
  }

  private normalizeProductDetails(input?: Record<string, unknown>) {
    if (!input) return Prisma.DbNull;
    const cleanText = (value: unknown, max: number) => {
      if (typeof value !== 'string') return null;
      const text = value.trim();
      if (!text) return null;
      if (text.length > max) throw new BadRequestException(`Product detail text cannot exceed ${max} characters.`);
      return text;
    };
    const material = cleanText(input.material, 1000);
    const dimensions = cleanText(input.dimensions, 1000);
    const care = cleanText(input.care, 1500);
    const highlights = Array.isArray(input.highlights)
      ? input.highlights.map((value) => cleanText(value, 300)).filter((value): value is string => Boolean(value)).slice(0, 12)
      : [];
    const specifications: Record<string, string> = {};
    if (input.specifications && typeof input.specifications === 'object' && !Array.isArray(input.specifications)) {
      for (const [rawLabel, rawValue] of Object.entries(input.specifications)) {
        const label = cleanText(rawLabel, 80);
        const value = cleanText(rawValue, 500);
        if (label && value) specifications[label] = value;
        if (Object.keys(specifications).length >= 30) break;
      }
    }
    const result = { ...(material ? { material } : {}), ...(dimensions ? { dimensions } : {}), ...(care ? { care } : {}), ...(highlights.length ? { highlights } : {}), ...(Object.keys(specifications).length ? { specifications } : {}) };
    return Object.keys(result).length ? result : Prisma.DbNull;
  }

  private normalizeColorSwatches(input?: Record<string, string>) {
    if (!input) return Prisma.DbNull;
    const result: Record<string, string> = {};
    for (const [rawName, rawHex] of Object.entries(input)) {
      const name = rawName.trim();
      const hex = typeof rawHex === 'string' ? rawHex.trim().toUpperCase() : '';
      if (!name || !hex) continue;
      if (name.length > 60) throw new BadRequestException('Color names cannot exceed 60 characters.');
      if (!/^#[0-9A-F]{6}$/.test(hex)) throw new BadRequestException(`Color swatch for ${name} must use a 6-digit hex value such as #1D1D1B.`);
      result[name] = hex;
      if (Object.keys(result).length > 40) throw new BadRequestException('A product can define at most 40 color swatches.');
    }
    return Object.keys(result).length ? result : Prisma.DbNull;
  }

  private validateVariantInput(data: {
    sku: string;
    name: string;
    priceCents: number;
    compareAtCents?: number | null;
    currency?: string;
    isActive?: boolean;
    optionValues?: Record<string, string>;
  }) {
    const sku = data.sku.trim().toUpperCase();
    const name = data.name.trim();
    const currency = (data.currency ?? 'MYR').trim().toUpperCase();
    if (!sku) throw new BadRequestException('SKU is required.');
    if (!name) throw new BadRequestException('Variant name is required.');
    if (data.priceCents < 0) throw new BadRequestException('Price cannot be negative.');
    if (data.compareAtCents != null && data.compareAtCents < data.priceCents) {
      throw new BadRequestException('Compare-at price must be greater than or equal to the selling price.');
    }
    return {
      sku,
      name,
      priceCents: data.priceCents,
      compareAtCents: data.compareAtCents ?? null,
      currency,
      isActive: data.isActive ?? true,
      optionValues: data.optionValues === undefined ? undefined : this.normalizeOptionValues(data.optionValues),
    };
  }

  private normalizeOptionValues(input: Record<string, string>) {
    const entries = Object.entries(input).map(([rawName, rawValue]) => [rawName.trim(), rawValue.trim()] as const);
    const filtered = entries.filter(([name, value]) => name && value);
    if (filtered.length > 3) throw new BadRequestException('A variant can have at most 3 product options.');
    const result: Record<string, string> = {};
    for (const [name, value] of filtered) {
      if (name.length > 40) throw new BadRequestException('Option names cannot exceed 40 characters.');
      if (value.length > 60) throw new BadRequestException('Option values cannot exceed 60 characters.');
      const duplicate = Object.keys(result).some((existing) => existing.toLowerCase() === name.toLowerCase());
      if (duplicate) throw new BadRequestException(`Duplicate option name: ${name}.`);
      result[name] = value;
    }
    return result;
  }

  private normalizeMatrixOptions(input: unknown[]) {
    if (!Array.isArray(input) || input.length < 1 || input.length > 3) {
      throw new BadRequestException('Variant matrix requires 1 to 3 options.');
    }
    const seenNames = new Set<string>();
    return input.map((raw) => {
      if (typeof raw !== 'object' || raw === null) throw new BadRequestException('Each option must include a name and values.');
      const source = raw as { name?: unknown; values?: unknown };
      const name = typeof source.name === 'string' ? source.name.trim() : '';
      if (!name || name.length > 40) throw new BadRequestException('Option names are required and limited to 40 characters.');
      const key = name.toLowerCase();
      if (seenNames.has(key)) throw new BadRequestException(`Duplicate option name: ${name}.`);
      seenNames.add(key);
      if (!Array.isArray(source.values)) throw new BadRequestException(`Option ${name} must include values.`);
      const values = [...new Set(source.values.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))];
      if (values.length < 1 || values.length > 20) throw new BadRequestException(`Option ${name} must contain 1 to 20 values.`);
      if (values.some((value) => value.length > 60)) throw new BadRequestException('Option values cannot exceed 60 characters.');
      return { name, values };
    });
  }

  private asOptionValues(value: unknown): Record<string, string> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  }

  private optionSignature(values: Record<string, string>) {
    return Object.entries(values).map(([name, value]) => `${name.toLowerCase()}=${value.toLowerCase()}`).sort().join('|');
  }

  private slugSkuPart(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'OPTION';
  }

  private async validateImageVariant(productId: string, variantId?: string | null) {
    if (!variantId) return;
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, productId }, select: { id: true } });
    if (!variant) throw new BadRequestException('Image variant must belong to this product.');
  }

  private isUniqueConstraint(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
  }

  private toPriceCents(value?: number) {
    if (value == null || !Number.isFinite(value) || value < 0) return undefined;
    return Math.round(value * 100);
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
