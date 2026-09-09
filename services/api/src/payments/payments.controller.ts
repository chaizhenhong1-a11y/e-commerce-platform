import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Body() body: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.create(
      body.orderNumber,
      body.provider,
      user.id,
      undefined,
      body.returnBaseUrl,
    );
  }

  @Post('reconcile')
  reconcile(
    @Body() body: ReconcilePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.reconcile(
      body.orderNumber,
      user.id,
      undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.findOne(
      id,
      user.id,
      undefined,
    );
  }

  @Post(':id/dev-confirm')
  confirmDevelopmentPayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.confirmDevelopmentPayment(
      id,
      user.id,
      undefined,
    );
  }
}
