import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @Matches(/^[0-9+()\-\s]{7,24}$/)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @IsString()
  @Length(5, 10)
  @Matches(/^[0-9A-Za-z -]+$/)
  postcode!: string;

  @IsIn(['MY'])
  countryCode!: 'MY';

  @IsIn(['STANDARD'])
  shippingMethod!: 'STANDARD';
}
