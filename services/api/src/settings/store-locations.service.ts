import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertStoreLocationDto } from './dto/upsert-store-location.dto';

export type StoreLocationRow = {
  id: string; name: string; addressLine1: string; addressLine2: string; city: string; state: string;
  postcode: string; countryCode: string; phone: string; businessHours: string; description: string; coverUrl: string;
  galleryUrls: string; isPrimary: boolean; isActive: boolean; sortOrder: number; createdAt: Date; updatedAt: Date;
};

@Injectable()
export class StoreLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private gallery(value: string) {
    try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []; }
    catch { return []; }
  }
  private present(row: StoreLocationRow) { return { ...row, galleryUrls: this.gallery(row.galleryUrls) }; }

  async list(includeInactive = false) {
    const rows = await this.prisma.$queryRaw<StoreLocationRow[]>(Prisma.sql`
      SELECT * FROM "StoreLocation"
      ${includeInactive ? Prisma.empty : Prisma.sql`WHERE "isActive" = true`}
      ORDER BY "isPrimary" DESC, "sortOrder" ASC, "createdAt" ASC
    `);
    return rows.map((row) => this.present(row));
  }

  async create(dto: UpsertStoreLocationDto) {
    const id = randomUUID();
    if (dto.isPrimary) await this.clearPrimary();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "StoreLocation" ("id","name","addressLine1","addressLine2","city","state","postcode","countryCode","phone","businessHours","description","coverUrl","galleryUrls","isPrimary","isActive","sortOrder","createdAt","updatedAt")
      VALUES (${id},${dto.name.trim()},${dto.addressLine1.trim()},${dto.addressLine2.trim()},${dto.city.trim()},${dto.state.trim()},${dto.postcode.trim()},${dto.countryCode.trim().toUpperCase()},${dto.phone.trim()},${dto.businessHours.trim()},${dto.description.trim()},${dto.coverUrl.trim()},${JSON.stringify(dto.galleryUrls)},${dto.isPrimary},${dto.isActive},${dto.sortOrder},NOW(),NOW())
    `);
    return this.get(id);
  }

  async update(id: string, dto: UpsertStoreLocationDto) {
    await this.get(id);
    if (dto.isPrimary) await this.clearPrimary(id);
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "StoreLocation" SET "name"=${dto.name.trim()},"addressLine1"=${dto.addressLine1.trim()},"addressLine2"=${dto.addressLine2.trim()},"city"=${dto.city.trim()},"state"=${dto.state.trim()},"postcode"=${dto.postcode.trim()},"countryCode"=${dto.countryCode.trim().toUpperCase()},"phone"=${dto.phone.trim()},"businessHours"=${dto.businessHours.trim()},"description"=${dto.description.trim()},"coverUrl"=${dto.coverUrl.trim()},"galleryUrls"=${JSON.stringify(dto.galleryUrls)},"isPrimary"=${dto.isPrimary},"isActive"=${dto.isActive},"sortOrder"=${dto.sortOrder},"updatedAt"=NOW() WHERE "id"=${id}
    `);
    return this.get(id);
  }

  async remove(id: string) {
    const current = await this.get(id);
    await this.prisma.$executeRaw(Prisma.sql`DELETE FROM "StoreLocation" WHERE "id"=${id}`);
    if (current.isPrimary) {
      const next = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT "id" FROM "StoreLocation" ORDER BY "sortOrder" ASC, "createdAt" ASC LIMIT 1`);
      if (next[0]) await this.prisma.$executeRaw(Prisma.sql`UPDATE "StoreLocation" SET "isPrimary"=true,"updatedAt"=NOW() WHERE "id"=${next[0].id}`);
    }
    return { deleted: true };
  }

  private async get(id: string) {
    const rows = await this.prisma.$queryRaw<StoreLocationRow[]>(Prisma.sql`SELECT * FROM "StoreLocation" WHERE "id"=${id} LIMIT 1`);
    if (!rows[0]) throw new NotFoundException('Store location not found.');
    return this.present(rows[0]);
  }

  private async clearPrimary(exceptId?: string) {
    if (exceptId) await this.prisma.$executeRaw(Prisma.sql`UPDATE "StoreLocation" SET "isPrimary"=false,"updatedAt"=NOW() WHERE "id"<>${exceptId} AND "isPrimary"=true`);
    else await this.prisma.$executeRaw(Prisma.sql`UPDATE "StoreLocation" SET "isPrimary"=false,"updatedAt"=NOW() WHERE "isPrimary"=true`);
  }
}
