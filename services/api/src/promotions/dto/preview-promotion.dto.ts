import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PreviewPromotionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId!: string;
}
