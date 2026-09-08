import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { OrdersService } from './orders.service';
import { StaffCommerceService } from './staff-commerce.service';

@Controller('staff/orders')
@UseGuards(StaffAuthGuard)
export class StaffOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly staffCommerceService: StaffCommerceService,
  ) {}

  @Get('summary')
  summary() {
    return this.staffCommerceService.getSummary();
  }

  @Get()
  list(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('q') query?: string,
  ) {
    return this.ordersService.getStaffOrders({ status, paymentStatus, query });
  }

  @Post(':orderNumber/process')
  process(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.markProcessingForStaff(orderNumber);
  }

  @Post(':orderNumber/ship')
  ship(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { courierName?: string; trackingNumber?: string; trackingUrl?: string },
  ) {
    return this.ordersService.shipForStaff(orderNumber, body);
  }

  @Post(':orderNumber/deliver')
  deliver(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.deliverForStaff(orderNumber);
  }

  @Post(':orderNumber/fulfill')
  fulfill(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.fulfillForStaff(orderNumber);
  }
}
