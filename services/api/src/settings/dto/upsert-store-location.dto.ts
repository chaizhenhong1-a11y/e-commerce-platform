import { IsBoolean, IsInt, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpsertStoreLocationDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(180) addressLine1!: string;
  @IsString() @MaxLength(180) addressLine2!: string;
  @IsString() @MaxLength(100) city!: string;
  @IsString() @MaxLength(100) state!: string;
  @IsString() @MaxLength(20) postcode!: string;
  @IsString() @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @IsString() @MaxLength(40) phone!: string;
  @IsString() @MaxLength(180) businessHours!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsString() @MaxLength(500) coverUrl!: string;
  @IsString({ each: true }) @MaxLength(500, { each: true }) galleryUrls!: string[];
  @IsBoolean() isPrimary!: boolean;
  @IsBoolean() isActive!: boolean;
  @IsInt() @Min(0) sortOrder!: number;
}
