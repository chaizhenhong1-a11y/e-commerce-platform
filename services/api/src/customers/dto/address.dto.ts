import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCustomerAddressDto {
  @IsString()
  @Length(1, 40)
  label!: string;

  @IsString()
  @Length(1, 120)
  recipientName!: string;

  @IsString()
  @Length(5, 30)
  phone!: string;

  @IsString()
  @Length(3, 160)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;

  @IsString()
  @Length(1, 100)
  city!: string;

  @IsString()
  @Length(1, 100)
  state!: string;

  @IsString()
  @Length(4, 12)
  postcode!: string;

  @IsOptional()
  @IsString()
  @IsIn(['MY'])
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCustomerAddressDto extends CreateCustomerAddressDto {}
