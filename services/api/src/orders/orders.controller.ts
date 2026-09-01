import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  myOrders(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getCustomerOrders(user.id);
  }


  @Post(':orderNumber/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.cancelOrder(
      orderNumber,
      user.id,
      undefined,
    );
  }

  @Get(':orderNumber/status')
  @UseGuards(JwtAuthGuard)
  status(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getStatus(
      orderNumber,
      user.id,
      undefined,
    );
  }
}
