import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestRefundDto } from './dto/request-refund.dto';
import { RefundsService } from './refunds.service';

@Controller('orders/:orderNumber/refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  request(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: RequestRefundDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.refundsService.request(
      orderNumber, dto.reason, dto.note, user.id, undefined,
    );
  }
}
