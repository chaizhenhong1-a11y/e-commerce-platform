import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { SaveCouponDto } from './dto/save-coupon.dto';
import { SaveAutomaticPromotionDto } from './dto/save-automatic-promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller('staff/promotions')
@UseGuards(StaffAuthGuard)
export class StaffPromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  list() {
    return this.promotions.listStaffCoupons();
  }

  @Post()
  create(@Body() input: SaveCouponDto) {
    return this.promotions.createCoupon(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: SaveCouponDto) {
    return this.promotions.updateCoupon(id, input);
  }

  @Get('automatic')
  listAutomatic() { return this.promotions.listAutomaticPromotions(); }

  @Post('automatic')
  createAutomatic(@Body() input: SaveAutomaticPromotionDto) { return this.promotions.createAutomaticPromotion(input); }

  @Patch('automatic/:id')
  updateAutomatic(@Param('id') id: string, @Body() input: SaveAutomaticPromotionDto) { return this.promotions.updateAutomaticPromotion(id, input); }

  @Post('automatic/:id/deactivate')
  deactivateAutomatic(@Param('id') id: string) { return this.promotions.deactivateAutomaticPromotion(id); }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.promotions.deactivateCoupon(id);
  }
}
