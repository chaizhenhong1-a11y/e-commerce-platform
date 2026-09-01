import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { PromotionsService } from './promotions.service';

@Controller('coupons')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post('validate')
  @UseGuards(OptionalJwtAuthGuard)
  validate(
    @Body() input: ValidateCouponDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.promotions.validateForCart(
      input.sessionId,
      input.couponCode,
      user?.id,
    );
  }
}
