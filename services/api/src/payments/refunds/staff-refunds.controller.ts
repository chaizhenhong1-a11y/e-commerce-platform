import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { RefundStatus } from '@prisma/client';
import { StaffAuthGuard } from '../../auth/guards/staff-auth.guard';
import { ReviewRefundDto } from './dto/review-refund.dto';
import { RefundsService } from './refunds.service';

@Controller('staff/refunds')
@UseGuards(StaffAuthGuard)
export class StaffRefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  list(@Query('status') status?: RefundStatus) {
    return this.refundsService.listForStaff(status);
  }

  @Post(':refundId/approve')
  approve(@Param('refundId') refundId: string) {
    return this.refundsService.approve(refundId);
  }

  @Post(':refundId/reject')
  reject(@Param('refundId') refundId: string, @Body() dto: ReviewRefundDto) {
    return this.refundsService.reject(refundId, dto.note);
  }
}
