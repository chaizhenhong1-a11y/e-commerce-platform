import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllForStaff() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async createForStaff(data: { name: string; slug: string; sortOrder?: number; isActive?: boolean }) {
    const clean = this.clean(data);
    try {
      return await this.prisma.category.create({
        data: {
          ...clean,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
        include: { _count: { select: { products: true } } },
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async updateForStaff(categoryId: string, data: { name: string; slug: string; sortOrder: number; isActive: boolean }) {
    await this.requireCategory(categoryId);
    const clean = this.clean(data);
    try {
      return await this.prisma.category.update({
        where: { id: categoryId },
        data: { ...clean, sortOrder: data.sortOrder, isActive: data.isActive },
        include: { _count: { select: { products: true } } },
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async deleteForStaff(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found.');
    if (category._count.products > 0) {
      throw new BadRequestException('This category is assigned to products. Deactivate it instead of deleting it.');
    }
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { deleted: true };
  }

  private async requireCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) throw new NotFoundException('Category not found.');
  }

  private clean(data: { name: string; slug: string }) {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();
    if (!name) throw new BadRequestException('Category name is required.');
    if (!slug) throw new BadRequestException('Category slug is required.');
    return { name, slug };
  }

  private rethrowUnique(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException('Category slug is already in use.');
    }
  }
}
