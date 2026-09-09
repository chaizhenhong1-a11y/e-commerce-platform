import {
  IsEmail,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsString()
  @MaxLength(120)
  storeName!: string;

  @IsString()
  @MaxLength(500)
  logoUrl!: string;

  @IsString()
  @MaxLength(500)
  storeCoverUrl!: string;

  @IsString({ each: true })
  @MaxLength(500, { each: true })
  storeGalleryUrls!: string[];

  @IsString()
  @MaxLength(180)
  storeTagline!: string;

  @IsString()
  @MaxLength(4000)
  storeDescription!: string;

  @IsEmail()
  @MaxLength(160)
  contactEmail!: string;

  @IsString()
  @MaxLength(40)
  contactPhone!: string;

  @IsString()
  @MaxLength(180)
  businessHours!: string;

  @IsString()
  @MaxLength(180)
  addressLine1!: string;

  @IsString()
  @MaxLength(180)
  addressLine2!: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @MaxLength(100)
  state!: string;

  @IsString()
  @MaxLength(20)
  postcode!: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsString()
  @MaxLength(80)
  timeZone!: string;

  @IsInt()
  @Min(0)
  standardShippingCents!: number;

  @IsInt()
  @Min(0)
  freeShippingThresholdCents!: number;

  @IsString()
  @MaxLength(120)
  estimatedDelivery!: string;

  @IsString()
  @MaxLength(6000)
  deliveryPolicy!: string;

  @IsInt()
  @Min(0)
  returnWindowDays!: number;

  @IsString()
  @MaxLength(180)
  returnCondition!: string;

  @IsString()
  @MaxLength(180)
  refundMethod!: string;

  @IsString()
  @MaxLength(6000)
  returnsPolicy!: string;

  @IsString()
  @MaxLength(8000)
  faqContent!: string;

  @IsString()
  @MaxLength(6000)
  trustSafetyContent!: string;

  @IsString()
  @MaxLength(12000)
  termsContent!: string;

  @IsString()
  @MaxLength(12000)
  privacyContent!: string;

  @IsString()
  @MaxLength(500)
  instagramUrl!: string;

  @IsString()
  @MaxLength(500)
  facebookUrl!: string;

  @IsString()
  @MaxLength(500)
  tiktokUrl!: string;
}
