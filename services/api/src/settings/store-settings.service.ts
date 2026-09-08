import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

type StoreSettingsRow = {
  id: string;
  storeName: string;
  logoUrl: string;
  storeCoverUrl: string;
  storeGalleryUrls: string;
  storeTagline: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  currency: string;
  timeZone: string;
  standardShippingCents: number;
  freeShippingThresholdCents: number;
  deliveryPolicy: string;
  returnsPolicy: string;
  faqContent: string;
  trustSafetyContent: string;
  termsContent: string;
  privacyContent: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULTS: Omit<StoreSettingsRow, 'createdAt' | 'updatedAt'> = {
  id: 'primary',
  storeName: 'TextShop',
  logoUrl: '',
  storeCoverUrl: '',
  storeGalleryUrls: '[]',
  storeTagline: 'Curated everyday products, straightforward service.',
  storeDescription: '',
  contactEmail: 'support@example.com',
  contactPhone: '',
  businessHours: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postcode: '',
  countryCode: 'MY',
  currency: 'MYR',
  timeZone: 'Asia/Kuala_Lumpur',
  standardShippingCents: 0,
  freeShippingThresholdCents: 0,
  deliveryPolicy: '',
  returnsPolicy: '',
  faqContent: '',
  trustSafetyContent: '',
  termsContent: '',
  privacyContent: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
};

@Injectable()
export class StoreSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<StoreSettingsRow> {
    const rows = await this.prisma.$queryRaw<StoreSettingsRow[]>(Prisma.sql`
      SELECT * FROM "StoreSettings" WHERE "id" = 'primary' LIMIT 1
    `);

    if (rows[0]) return rows[0];

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "StoreSettings" (
        "id", "storeName", "logoUrl", "storeCoverUrl", "storeGalleryUrls", "storeTagline", "storeDescription",
        "contactEmail", "contactPhone", "businessHours", "addressLine1",
        "addressLine2", "city", "state", "postcode", "countryCode",
        "currency", "timeZone", "standardShippingCents",
        "freeShippingThresholdCents", "deliveryPolicy", "returnsPolicy",
        "faqContent", "trustSafetyContent", "termsContent", "privacyContent",
        "instagramUrl", "facebookUrl", "tiktokUrl", "createdAt", "updatedAt"
      ) VALUES (
        ${DEFAULTS.id}, ${DEFAULTS.storeName}, ${DEFAULTS.logoUrl}, ${DEFAULTS.storeCoverUrl},
        ${DEFAULTS.storeGalleryUrls}, ${DEFAULTS.storeTagline}, ${DEFAULTS.storeDescription},
        ${DEFAULTS.contactEmail}, ${DEFAULTS.contactPhone}, ${DEFAULTS.businessHours},
        ${DEFAULTS.addressLine1}, ${DEFAULTS.addressLine2}, ${DEFAULTS.city},
        ${DEFAULTS.state}, ${DEFAULTS.postcode}, ${DEFAULTS.countryCode},
        ${DEFAULTS.currency}, ${DEFAULTS.timeZone}, ${DEFAULTS.standardShippingCents},
        ${DEFAULTS.freeShippingThresholdCents}, ${DEFAULTS.deliveryPolicy},
        ${DEFAULTS.returnsPolicy}, ${DEFAULTS.faqContent}, ${DEFAULTS.trustSafetyContent},
        ${DEFAULTS.termsContent}, ${DEFAULTS.privacyContent}, ${DEFAULTS.instagramUrl},
        ${DEFAULTS.facebookUrl}, ${DEFAULTS.tiktokUrl}, NOW(), NOW()
      ) ON CONFLICT ("id") DO NOTHING
    `);

    const created = await this.prisma.$queryRaw<StoreSettingsRow[]>(Prisma.sql`
      SELECT * FROM "StoreSettings" WHERE "id" = 'primary' LIMIT 1
    `);
    if (!created[0]) throw new Error('Unable to create store settings.');
    return created[0];
  }

  toStaff(settings: StoreSettingsRow) {
    return {
      ...settings,
      storeGalleryUrls: this.gallery(settings.storeGalleryUrls),
    };
  }

  toPublic(settings: StoreSettingsRow) {
    return {
      storeName: settings.storeName,
      logoUrl: settings.logoUrl,
      storeCoverUrl: settings.storeCoverUrl,
      storeGalleryUrls: this.gallery(settings.storeGalleryUrls),
      storeTagline: settings.storeTagline,
      storeDescription: settings.storeDescription,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      businessHours: settings.businessHours,
      addressLine1: settings.addressLine1,
      addressLine2: settings.addressLine2,
      city: settings.city,
      state: settings.state,
      postcode: settings.postcode,
      countryCode: settings.countryCode,
      currency: settings.currency,
      standardShippingCents: settings.standardShippingCents,
      freeShippingThresholdCents: settings.freeShippingThresholdCents,
      deliveryPolicy: settings.deliveryPolicy,
      returnsPolicy: settings.returnsPolicy,
      faqContent: settings.faqContent,
      trustSafetyContent: settings.trustSafetyContent,
      termsContent: settings.termsContent,
      privacyContent: settings.privacyContent,
      instagramUrl: settings.instagramUrl,
      facebookUrl: settings.facebookUrl,
      tiktokUrl: settings.tiktokUrl,
      updatedAt: settings.updatedAt,
    };
  }

  private gallery(value: string) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  async update(dto: UpdateStoreSettingsDto) {
    const text = (value: string) => value.trim();
    const email = text(dto.contactEmail).toLowerCase();

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "StoreSettings" (
        "id", "storeName", "logoUrl", "storeCoverUrl", "storeGalleryUrls", "storeTagline", "storeDescription",
        "contactEmail", "contactPhone", "businessHours", "addressLine1",
        "addressLine2", "city", "state", "postcode", "countryCode",
        "currency", "timeZone", "standardShippingCents",
        "freeShippingThresholdCents", "deliveryPolicy", "returnsPolicy",
        "faqContent", "trustSafetyContent", "termsContent", "privacyContent",
        "instagramUrl", "facebookUrl", "tiktokUrl", "createdAt", "updatedAt"
      ) VALUES (
        'primary', ${text(dto.storeName)}, ${text(dto.logoUrl)}, ${text(dto.storeCoverUrl)},
        ${JSON.stringify(dto.storeGalleryUrls)}, ${text(dto.storeTagline)}, ${text(dto.storeDescription)}, ${email},
        ${text(dto.contactPhone)}, ${text(dto.businessHours)}, ${text(dto.addressLine1)},
        ${text(dto.addressLine2)}, ${text(dto.city)}, ${text(dto.state)},
        ${text(dto.postcode)}, ${text(dto.countryCode).toUpperCase()},
        ${text(dto.currency).toUpperCase()}, ${text(dto.timeZone)},
        ${dto.standardShippingCents}, ${dto.freeShippingThresholdCents},
        ${text(dto.deliveryPolicy)}, ${text(dto.returnsPolicy)}, ${text(dto.faqContent)},
        ${text(dto.trustSafetyContent)}, ${text(dto.termsContent)}, ${text(dto.privacyContent)},
        ${text(dto.instagramUrl)}, ${text(dto.facebookUrl)}, ${text(dto.tiktokUrl)}, NOW(), NOW()
      ) ON CONFLICT ("id") DO UPDATE SET
        "storeName" = EXCLUDED."storeName",
        "logoUrl" = EXCLUDED."logoUrl",
        "storeCoverUrl" = EXCLUDED."storeCoverUrl",
        "storeGalleryUrls" = EXCLUDED."storeGalleryUrls",
        "storeTagline" = EXCLUDED."storeTagline",
        "storeDescription" = EXCLUDED."storeDescription",
        "contactEmail" = EXCLUDED."contactEmail",
        "contactPhone" = EXCLUDED."contactPhone",
        "businessHours" = EXCLUDED."businessHours",
        "addressLine1" = EXCLUDED."addressLine1",
        "addressLine2" = EXCLUDED."addressLine2",
        "city" = EXCLUDED."city",
        "state" = EXCLUDED."state",
        "postcode" = EXCLUDED."postcode",
        "countryCode" = EXCLUDED."countryCode",
        "currency" = EXCLUDED."currency",
        "timeZone" = EXCLUDED."timeZone",
        "standardShippingCents" = EXCLUDED."standardShippingCents",
        "freeShippingThresholdCents" = EXCLUDED."freeShippingThresholdCents",
        "deliveryPolicy" = EXCLUDED."deliveryPolicy",
        "returnsPolicy" = EXCLUDED."returnsPolicy",
        "faqContent" = EXCLUDED."faqContent",
        "trustSafetyContent" = EXCLUDED."trustSafetyContent",
        "termsContent" = EXCLUDED."termsContent",
        "privacyContent" = EXCLUDED."privacyContent",
        "instagramUrl" = EXCLUDED."instagramUrl",
        "facebookUrl" = EXCLUDED."facebookUrl",
        "tiktokUrl" = EXCLUDED."tiktokUrl",
        "updatedAt" = NOW()
    `);

    return this.get();
  }
}
