import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() body: CreateCheckoutDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.checkoutService.createOrder(
      body,
      user?.id,
    );
  }
}
