import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { PreviewPromotionDto } from './dto/preview-promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PublicPromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post('preview')
  @UseGuards(OptionalJwtAuthGuard)
  preview(@Body() input: PreviewPromotionDto) {
    return this.promotions.previewAutomaticForCart(input.sessionId);
  }
}
