import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateStaffCategoryDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(120) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStaffCategoryDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(120) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsInt() @Min(0) sortOrder!: number;
  @IsBoolean() isActive!: boolean;
}
