import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(OptionalJwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Body() body: CreatePaymentDto,
    @CurrentUser() user?: AuthenticatedUser,
    @Headers('x-order-access-token') guestToken?: string,
  ) {
    return this.paymentsService.create(
      body.orderNumber,
      body.provider,
      user?.id,
      guestToken,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
    @Headers('x-order-access-token') guestToken?: string,
  ) {
    return this.paymentsService.findOne(
      id,
      user?.id,
      guestToken,
    );
  }

  @Post(':id/dev-confirm')
  confirmDevelopmentPayment(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
    @Headers('x-order-access-token') guestToken?: string,
  ) {
    return this.paymentsService.confirmDevelopmentPayment(
      id,
      user?.id,
      guestToken,
    );
  }
}
